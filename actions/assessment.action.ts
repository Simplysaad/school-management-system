"use server";

import connectDB from "@/lib/db";
import { Assessment } from "@/models/assessment.model";
import { Submission } from "@/models/submission.model";
import { Student } from "@/models/student.model";
import { authorizeGrading } from "@/lib/auth-guard";
import { Types } from "mongoose";

/**
 * 1. Create an Assessment Record (Supports PHYSICAL or ONLINE_QUIZ with embedded questions)
 */
export async function createAssessment(
  userId: string,
  schoolId: string,
  data: {
    academicYear: string;
    term: string;
    classId: string;
    subjectName: string;
    title: string;
    type: "PHYSICAL" | "ONLINE_QUIZ";
    maxScore: number;
    weightage: number;
    questions?: Array<{
      title: string;
      description: string;
      type: "multiple-choice" | "true-false" | "short-answer" | "essay";
      options?: Array<{ text: string; isCorrect: boolean }>;
      points: number;
    }>;
  },
) {
  try {
    const auth = await authorizeGrading(userId, data.classId, schoolId);
    if (!auth.authorized) return { success: false, error: auth.error };

    await connectDB();

    const assessment = await Assessment.create({
      schoolId: new Types.ObjectId(schoolId),
      classId: new Types.ObjectId(data.classId),
      academicYear: data.academicYear,
      term: data.term,
      subjectName: data.subjectName,
      title: data.title,
      type: data.type || "PHYSICAL",
      maxScore: data.maxScore,
      weightage: data.weightage,
      questions: data.type === "ONLINE_QUIZ" ? data.questions || [] : [],
    });

    return {
      success: true,
      assessment: JSON.parse(JSON.stringify(assessment)),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to create assessment.",
    };
  }
}

/**
 * 2. Option A: Input / Save Single Student Grade Individually (For PHYSICAL assessments)
 */
export async function submitIndividualGrade(
  userId: string,
  schoolId: string,
  data: {
    assessmentId: string;
    studentId: string;
    scoreObtained: number;
    remarks?: string;
  },
) {
  try {
    await connectDB();

    const assessment = await Assessment.findOne({
      _id: data.assessmentId,
      schoolId,
    });
    if (!assessment) return { success: false, error: "Assessment not found." };

    if (assessment.type === "ONLINE_QUIZ") {
      return {
        success: false,
        error:
          "Online quizzes are automatically scored upon student submission.",
      };
    }

    // Verify authorization for the assessment's target class
    const auth = await authorizeGrading(
      userId,
      assessment.classId.toString(),
      schoolId,
    );
    if (!auth.authorized) return { success: false, error: auth.error };

    if (data.scoreObtained > assessment.maxScore) {
      return {
        success: false,
        error: `Score cannot exceed maximum limit of ${assessment.maxScore}.`,
      };
    }

    // Upsert submission/grade entry using isolated Submission model
    const submission = await Submission.findOneAndUpdate(
      { schoolId, assessmentId: data.assessmentId, studentId: data.studentId },
      {
        $set: {
          scoreObtained: data.scoreObtained,
          remarks: data.remarks || "",
          status: "GRADED",
          gradedBy: new Types.ObjectId(userId),
        },
      },
      { upsert: true, new: true, runValidators: true },
    );

    return {
      success: true,
      submission: JSON.parse(JSON.stringify(submission)),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to submit grade.",
    };
  }
}

/**
 * 3. Option B: Bulk Upload Grades via CSV Batch (For PHYSICAL assessments)
 */
export async function bulkUploadGradesFromCSV(
  userId: string,
  schoolId: string,
  assessmentId: string,
  csvRecords: Array<{
    admissionNumber: string;
    scoreObtained: number;
    remarks?: string;
  }>,
) {
  try {
    await connectDB();

    const assessment = await Assessment.findOne({
      _id: assessmentId,
      schoolId,
    });
    if (!assessment)
      return { success: false, error: "Assessment context missing." };

    if (assessment.type === "ONLINE_QUIZ") {
      return {
        success: false,
        error: "Cannot bulk upload CSV scores for online quiz assessments.",
      };
    }

    const auth = await authorizeGrading(
      userId,
      assessment.classId.toString(),
      schoolId,
    );
    if (!auth.authorized) return { success: false, error: auth.error };

    const bulkOps = [];
    const errors: string[] = [];

    for (const record of csvRecords) {
      if (record.scoreObtained > assessment.maxScore) {
        errors.push(
          `Admission ${record.admissionNumber}: Score exceeds ${assessment.maxScore}.`,
        );
        continue;
      }

      const student = await Student.findOne({
        schoolId,
        classId: assessment.classId,
        admissionNumber: record.admissionNumber.trim(),
      });

      if (!student) {
        errors.push(
          `Admission ${record.admissionNumber}: Student not found in this classroom.`,
        );
        continue;
      }

      bulkOps.push({
        updateOne: {
          filter: {
            schoolId,
            assessmentId: assessment._id,
            studentId: student._id,
          },
          update: {
            $set: {
              scoreObtained: Number(record.scoreObtained),
              remarks: record.remarks || "",
              status: "GRADED",
              gradedBy: new Types.ObjectId(userId),
            },
          },
          upsert: true,
        },
      });
    }

    if (bulkOps.length > 0) {
      await Submission.bulkWrite(bulkOps);
    }

    return {
      success: true,
      processedCount: bulkOps.length,
      errors,
      message: `Successfully processed ${bulkOps.length} grades. ${errors.length} skipped.`,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "CSV processing failed." };
  }
}

/**
 * 4. Submit Online Quiz Student Attempt & Auto-Calculate Score
 */
export async function submitOnlineQuiz(
  schoolId: string,
  assessmentId: string,
  studentId: string,
  studentAnswers: Array<{
    questionId: string;
    selectedOptionIndex?: number;
    textAnswer?: string;
  }>,
) {
  try {
    await connectDB();

    const assessment = await Assessment.findOne({
      _id: assessmentId,
      schoolId,
      type: "ONLINE_QUIZ",
    });
    if (!assessment)
      return { success: false, error: "Quiz assessment not found." };

    let totalScoreObtained = 0;
    const processedAnswers = [];

    for (const ans of studentAnswers) {
      // Find question inside embedded subdocument array using Mongoose .id() helper
      const question = assessment.questions.id(ans.questionId);
      if (!question) continue;

      let isCorrect = false;
      let pointsAwarded = 0;

      if (
        question.type === "multiple-choice" ||
        question.type === "true-false"
      ) {
        const correctOptionIndex = question.options?.findIndex(
          (opt: any) => opt.isCorrect,
        );
        if (
          correctOptionIndex !== undefined &&
          correctOptionIndex === ans.selectedOptionIndex
        ) {
          isCorrect = true;
          pointsAwarded = question.points;
        }
      } else {
        // Short-answer or essay requires manual teacher grading later
        isCorrect = false;
        pointsAwarded = 0;
      }

      totalScoreObtained += pointsAwarded;

      processedAnswers.push({
        questionId: new Types.ObjectId(ans.questionId),
        selectedOptionIndex: ans.selectedOptionIndex,
        textAnswer: ans.textAnswer,
        isCorrect,
        pointsAwarded,
      });
    }

    const submission = await Submission.findOneAndUpdate(
      { schoolId, assessmentId, studentId },
      {
        $set: {
          status: "SUBMITTED",
          answers: processedAnswers,
          scoreObtained: totalScoreObtained,
          submittedAt: new Date(),
        },
      },
      { upsert: true, new: true, runValidators: true },
    );

    return {
      success: true,
      submission: JSON.parse(JSON.stringify(submission)),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to submit quiz." };
  }
}

/**
 * 5. Get Assessment Summary with All Enrolled Students and Submissions (Gradebook)
 */
export async function getAssessmentGradeSheet(
  userId: string,
  schoolId: string,
  assessmentId: string,
) {
  try {
    await connectDB();

    const assessment = await Assessment.findOne({
      _id: assessmentId,
      schoolId,
    }).populate("classId");
    if (!assessment) return { success: false, error: "Assessment not found." };

    const auth = await authorizeGrading(
      userId,
      assessment.classId._id.toString(),
      schoolId,
    );
    if (!auth.authorized) return { success: false, error: auth.error };

    // Fetch students in class
    const students = await Student.find({
      schoolId,
      classId: assessment.classId._id,
    })
      .select("admissionNumber firstName lastName gender")
      .sort({ lastName: 1, firstName: 1 });

    // Fetch existing submissions recorded for this assessment
    const existingSubmissions = await Submission.find({
      schoolId,
      assessmentId,
    });
    const submissionMap = new Map(
      existingSubmissions.map((sub) => [sub.studentId.toString(), sub]),
    );

    const roster = students.map((student) => {
      const submission = submissionMap.get(student._id.toString());
      return {
        student: JSON.parse(JSON.stringify(student)),
        grade: submission ? JSON.parse(JSON.stringify(submission)) : null,
      };
    });

    return {
      success: true,
      assessment: JSON.parse(JSON.stringify(assessment)),
      roster,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to load grade sheet.",
    };
  }
}
