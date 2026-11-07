"use server";

import connectDB from "@/lib/db";
import { Student } from "@/models/student.model";
import { User } from "@/models/user.model";
import { Teacher } from "@/models/teacher.model";
import { Parent } from "@/models/parent.model";
import { Grade } from "@/models/grade.model";
import { Assessment } from "@/models/assessment.model";
import { Types } from "mongoose";

/**
 * Helper to verify role access for viewing results (Admin, Teacher of class, or Parent of ward)
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
 * Generate Complete Result Card / Transcript Data for a Student (Term/Session Breakdown)
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

    // 2. Fetch student's grades for these assessments
    const grades = await Grade.find({
      schoolId,
      studentId,
      assessmentId: { $in: assessmentIds },
    }).populate("assessmentId");

    // 3. Group grades by subject
    const subjectMap: Record<
      string,
      {
        subjectName: string;
        totalObtained: number;
        maxPossible: number;
        assessments: any[];
      }
    > = {};

    grades.forEach((grade: any) => {
      const assessment = grade.assessmentId;
      if (!assessment) return;

      const sub = assessment.subjectName;
      if (!subjectMap[sub]) {
        subjectMap[sub] = {
          subjectName: sub,
          totalObtained: 0,
          maxPossible: 0,
          assessments: [],
        };
      }

      subjectMap[sub].totalObtained += grade.scoreObtained;
      subjectMap[sub].maxPossible += assessment.maxScore;
      subjectMap[sub].assessments.push({
        title: assessment.title,
        scoreObtained: grade.scoreObtained,
        maxScore: assessment.maxScore,
        weightage: assessment.weightage,
        remarks: grade.remarks,
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
