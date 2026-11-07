"use server";

import connectDB from "@/lib/db";
import { Assessment } from "@/models/assessment.model";
import { Grade } from "@/models/grade.model";
import { Student } from "@/models/student.model";
import { authorizeGrading } from "@/lib/auth-guard";
import { Types } from "mongoose";

/**
 * 1. Create an Assessment Record
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
    maxScore: number;
    weightage: number;
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
      maxScore: data.maxScore,
      weightage: data.weightage,
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
 * 2. Option A: Input / Save Single Student Grade Individually
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

    // Upsert grade entry (Insert or update existing)
    const grade = await Grade.findOneAndUpdate(
      { schoolId, assessmentId: data.assessmentId, studentId: data.studentId },
      {
        $set: {
          scoreObtained: data.scoreObtained,
          remarks: data.remarks || "",
          enteredBy: new Types.ObjectId(userId),
        },
      },
      { upsert: true, new: true, runValidators: true },
    );

    return { success: true, grade: JSON.parse(JSON.stringify(grade)) };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to submit grade.",
    };
  }
}

/**
 * 3. Option B: Bulk Upload Grades via CSV Batch
 * Expects CSV rows with headers: admissionNumber, scoreObtained, remarks
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

    // Authorization check
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

      // Lookup student by admission number within current school & class
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
              enteredBy: new Types.ObjectId(userId),
            },
          },
          upsert: true,
        },
      });
    }

    if (bulkOps.length > 0) {
      await Grade.bulkWrite(bulkOps);
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
 * 4. Get Assessment Summary with All Enrolled Students and Grades
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

    // Fetch existing grades recorded for this assessment
    const existingGrades = await Grade.find({ schoolId, assessmentId });
    const gradeMap = new Map(
      existingGrades.map((g) => [g.studentId.toString(), g]),
    );

    // Combine student list with recorded scores
    const roster = students.map((student) => {
      const grade = gradeMap.get(student._id.toString());
      return {
        student: JSON.parse(JSON.stringify(student)),
        grade: grade ? JSON.parse(JSON.stringify(grade)) : null,
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
