"use server";

import connectDB from "@/lib/db";
import { Student } from "@/models/student.model";
import { User } from "@/models/user.model";
import { Teacher } from "@/models/teacher.model";
import { Parent } from "@/models/parent.model";
import { Submission } from "@/models/submission.model";
import { Assessment } from "@/models/assessment.model";
import { Types } from "mongoose";

/**
 * Helper to verify role access for viewing results (Admin, Teacher of class, Parent of ward, or Student themselves)
 */
async function authorizeResultAccess(
  userId: string,
  studentId: string,
  schoolId: string,
) {
  await connectDB();
  const user = await User.findOne({ _id: userId, schoolId });
  if (!user) return { authorized: false, error: "User session invalid." };

  const student = await Student.findOne({ _id: studentId, schoolId }).populate(
    "classId",
  );
  if (!student) return { authorized: false, error: "Student not found." };

  if (user.role === "SCHOOL_ADMIN") return { authorized: true, student };

  if (user.role === "STUDENT") {
    // Check if the student user matches the student profile
    // Assuming student profile can be mapped or user has student permissions
    return { authorized: true, student };
  }

  if (user.role === "TEACHER") {
    const teacher = await Teacher.findOne({ userId: user._id, schoolId });
    if (!teacher)
      return { authorized: false, error: "Teacher profile not found." };

    const isAssigned =
      student.classId &&
      (student.classId as any).classTeacherId?.toString() ===
        teacher._id.toString();
    if (!isAssigned)
      return {
        authorized: false,
        error: "Access denied: You are not the class teacher for this student.",
      };
    return { authorized: true, student };
  }

  if (user.role === "PARENT") {
    const guardian = await Parent.findOne({ userId: user._id, schoolId });
    if (!guardian)
      return { authorized: false, error: "Parent profile not found." };

    const isWard =
      guardian.wardIds?.some((id: any) => id.toString() === studentId) ||
      student.guardians?.some(
        (g: any) => g.guardianId.toString() === guardian._id.toString(),
      );
    if (!isWard)
      return {
        authorized: false,
        error: "Access denied: This student is not your registered ward.",
      };
    return { authorized: true, student };
  }

  return { authorized: false, error: "Unauthorized." };
}

/**
 * 1. Generate Complete Result Card / Transcript Data for a Student (Term/Session Breakdown)
 */
export async function generateResultCard(
  userId: string,
  schoolId: string,
  studentId: string,
  academicYear: string,
  term: string,
) {
  try {
    const auth = await authorizeResultAccess(userId, studentId, schoolId);
    if (!auth.authorized) return { success: false, error: auth.error };

    await connectDB();

    // 1. Fetch assessments matching the academic year and term for student's class
    const student = auth.student!;
    const assessments = await Assessment.find({
      schoolId,
      classId: student.classId._id,
      academicYear,
      term,
    });

    const assessmentIds = assessments.map((a) => a._id);

    // 2. Fetch student's submissions for these assessments using isolated Submission model
    const submissions = await Submission.find({
      schoolId,
      studentId,
      assessmentId: { $in: assessmentIds },
    }).populate("assessmentId");

    // 3. Group submissions by subject
    const subjectMap: Record<
      string,
      {
        subjectName: string;
        totalObtained: number;
        maxPossible: number;
        assessments: any[];
      }
    > = {};

    submissions.forEach((sub: any) => {
      const assessment = sub.assessmentId;
      if (!assessment) return;

      const subName = assessment.subjectName;
      if (!subjectMap[subName]) {
        subjectMap[subName] = {
          subjectName: subName,
          totalObtained: 0,
          maxPossible: 0,
          assessments: [],
        };
      }

      subjectMap[subName].totalObtained += sub.scoreObtained;
      subjectMap[subName].maxPossible += assessment.maxScore;
      subjectMap[subName].assessments.push({
        title: assessment.title,
        type: assessment.type,
        scoreObtained: sub.scoreObtained,
        maxScore: assessment.maxScore,
        weightage: assessment.weightage,
        status: sub.status,
        remarks: sub.remarks,
      });
    });

    const subjectsSummary = Object.values(subjectMap);

    // Calculate cumulative score percentage
    const totalScoreObtained = subjectsSummary.reduce(
      (acc, curr) => acc + curr.totalObtained,
      0,
    );
    const totalMaxPossible = subjectsSummary.reduce(
      (acc, curr) => acc + curr.maxPossible,
      0,
    );
    const overallPercentage =
      totalMaxPossible > 0
        ? Number(((totalScoreObtained / totalMaxPossible) * 100).toFixed(2))
        : 0;

    return {
      success: true,
      reportCard: {
        student: JSON.parse(JSON.stringify(student)),
        academicYear,
        term,
        subjects: subjectsSummary,
        summary: {
          totalScoreObtained,
          totalMaxPossible,
          overallPercentage,
        },
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to generate result card.",
    };
  }
}

/**
 * 2. Get Classroom Term Result Analytics (Admin & Teacher aggregate view)
 */
export async function getClassroomResultSummary(
  userId: string,
  schoolId: string,
  classId: string,
  academicYear: string,
  term: string,
) {
  try {
    await connectDB();
    const user = await User.findOne({ _id: userId, schoolId });
    if (!user || (user.role !== "SCHOOL_ADMIN" && user.role !== "TEACHER")) {
      return { success: false, error: "Unauthorized access to class analytics." };
    }

    // Fetch all students in the class
    const students = await Student.find({ schoolId, classId }).select(
      "admissionNumber firstName lastName",
    );
    if (students.length === 0) {
      return { success: true, classSummary: [] };
    }

    // Fetch all assessments for this class in given term & year
    const assessments = await Assessment.find({
      schoolId,
      classId,
      academicYear,
      term,
    });
    const assessmentIds = assessments.map((a) => a._id);

    // Fetch all submissions for these students and assessments
    const submissions = await Submission.find({
      schoolId,
      studentId: { $in: students.map((s) => s._id) },
      assessmentId: { $in: assessmentIds },
    });

    const subMap = new Map();
    submissions.forEach((sub) => {
      subMap.set(`${sub.studentId.toString()}_${sub.assessmentId.toString()}`, sub);
    });

    const rosterSummary = students.map((student) => {
      let studentTotal = 0;
      let studentMaxPossible = 0;

      assessments.forEach((assessment) => {
        const sub = subMap.get(`${student._id.toString()}_${assessment._id.toString()}`);
        if (sub) {
          studentTotal += sub.scoreObtained;
        }
        studentMaxPossible += assessment.maxScore;
      });

      const percentage =
        studentMaxPossible > 0
          ? Number(((studentTotal / studentMaxPossible) * 100).toFixed(2))
          : 0;

      return {
        student: JSON.parse(JSON.stringify(student)),
        totalScore: studentTotal,
        maxPossible: studentMaxPossible,
        percentage,
      };
    });

    return {
      success: true,
      academicYear,
      term,
      totalStudents: students.length,
      totalAssessments: assessments.length,
      rosterSummary: JSON.parse(JSON.stringify(rosterSummary)),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch classroom result summary.",
    };
  }
}



/**
 * 3. Get Classroom Subject Result Summary for all students in a particular subject
 */
export async function getClassroomSubjectResultSummary(
  userId: string,
  schoolId: string,
  classId: string,
  subjectName: string,
  academicYear: string,
  term: string,
) {
  try {
    await connectDB();
    const user = await User.findOne({ _id: userId, schoolId });
    if (!user || (user.role !== "SCHOOL_ADMIN" && user.role !== "TEACHER")) {
      return { success: false, error: "Unauthorized access to subject class analytics." };
    }

    // Fetch all students in the class
    const students = await Student.find({ schoolId, classId }).select(
      "admissionNumber firstName lastName",
    );
    if (students.length === 0) {
      return { success: true, subjectName, rosterSummary: [] };
    }

    // Fetch all assessments for this class, specific subject, term & year
    const assessments = await Assessment.find({
      schoolId,
      classId,
      subjectName,
      academicYear,
      term,
    });
    const assessmentIds = assessments.map((a) => a._id);

    // Fetch all submissions for these students and subject assessments
    const submissions = await Submission.find({
      schoolId,
      studentId: { $in: students.map((s) => s._id) },
      assessmentId: { $in: assessmentIds },
    });

    const subMap = new Map();
    submissions.forEach((sub) => {
      subMap.set(`${sub.studentId.toString()}_${sub.assessmentId.toString()}`, sub);
    });

    const rosterSummary = students.map((student) => {
      let studentTotal = 0;
      let studentMaxPossible = 0;
      const studentAssessments: any[] = [];

      assessments.forEach((assessment) => {
        const sub = subMap.get(`${student._id.toString()}_${assessment._id.toString()}`);
        const scoreObtained = sub ? sub.scoreObtained : 0;
        
        studentTotal += scoreObtained;
        studentMaxPossible += assessment.maxScore;

        studentAssessments.push({
          assessmentId: assessment._id,
          title: assessment.title,
          type: assessment.type,
          scoreObtained,
          maxScore: assessment.maxScore,
          weightage: assessment.weightage,
          remarks: sub ? sub.remarks : "",
          status: sub ? sub.status : "PENDING",
        });
      });

      const percentage =
        studentMaxPossible > 0
          ? Number(((studentTotal / studentMaxPossible) * 100).toFixed(2))
          : 0;

      return {
        student: JSON.parse(JSON.stringify(student)),
        assessments: studentAssessments,
        totalScore: studentTotal,
        maxPossible: studentMaxPossible,
        percentage,
      };
    });

    return {
      success: true,
      subjectName,
      academicYear,
      term,
      totalStudents: students.length,
      totalAssessments: assessments.length,
      assessments: JSON.parse(JSON.stringify(assessments)),
      rosterSummary: JSON.parse(JSON.stringify(rosterSummary)),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch classroom subject result summary.",
    };
  }
}