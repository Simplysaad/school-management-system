"use server";

import connectDB from "@/lib/db";
import { Student } from "@/models/student.model";
import { User } from "@/models/user.model";
import { Teacher } from "@/models/teacher.model";
import { Parent } from "@/models/parent.model"; // Ensure this matches your model filename/export (guardian.model.ts)
import { Classroom } from "@/models/classroom.model";
import { Grade } from "@/models/grade.model";
import { Types } from "mongoose";

import { parseCSVFile } from "@/lib/csvParser";

/**
 * Helper to verify role-based access to a specific student
 */
async function authorizeStudentAccess(
  userId: string,
  studentId: string,
  schoolId: string,
) {
  await connectDB();
  const user = await User.findOne({ _id: userId, schoolId });
  if (!user) return { authorized: false, error: "User session invalid." };

  const student = await Student.findOne({ _id: studentId, schoolId });
  if (!student) return { authorized: false, error: "Student not found." };

  if (user.role === "SCHOOL_ADMIN") {
    return { authorized: true, user, student };
  }

  if (user.role === "TEACHER") {
    const teacher = await Teacher.findOne({ userId: user._id, schoolId });
    if (!teacher)
      return { authorized: false, error: "Teacher profile not found." };

    // Check if student belongs to a classroom assigned to this teacher
    const classroom = await Classroom.findOne({
      _id: student.classId,
      schoolId,
      classTeacherId: teacher._id,
    });

    if (!classroom) {
      return {
        authorized: false,
        error: "Access denied: Student is not in your assigned class.",
      };
    }
    return { authorized: true, user, student };
  }

  if (user.role === "PARENT") {
    const guardian = await Parent.findOne({ userId: user._id, schoolId });
    if (!guardian)
      return { authorized: false, error: "Parent profile not found." };

    // Check if student ID is linked in guardian's wardIds or student's guardians array
    const isLinked =
      guardian.wardIds?.some((id: any) => id.toString() === studentId) ||
      student.guardians?.some(
        (g: any) => g.guardianId.toString() === guardian._id.toString(),
      );

    if (!isLinked) {
      return {
        authorized: false,
        error: "Access denied: This student is not registered as your ward.",
      };
    }
    return { authorized: true, user, student };
  }

  return { authorized: false, error: "Unauthorized access." };
}

/**
 * 1. Get All Students based on Role & Permissions
 */
export async function getStudents(userId: string, schoolId: string) {
  try {
    await connectDB();
    const user = await User.findOne({ _id: userId, schoolId });
    if (!user) return { success: false, error: "User not found." };

    let query: any = { schoolId };

    if (user.role === "SCHOOL_ADMIN") {
      // Admin sees all students in the school
      const students = await Student.find(query)
        .populate("classId", "name section category")
        .sort({ lastName: 1, firstName: 1 });
      return { success: true, students: JSON.parse(JSON.stringify(students)) };
    }

    if (user.role === "TEACHER") {
      const teacher = await Teacher.findOne({ userId: user._id, schoolId });
      if (!teacher) return { success: false, students: [] };

      // Find all classrooms where this teacher is assigned
      const classrooms = await Classroom.find({
        schoolId,
        classTeacherId: teacher._id,
      });
      const classIds = classrooms.map((c) => c._id);

      const students = await Student.find({
        schoolId,
        classId: { $in: classIds },
      })
        .populate("classId", "name section category")
        .sort({ lastName: 1, firstName: 1 });
      return { success: true, students: JSON.parse(JSON.stringify(students)) };
    }

    if (user.role === "PARENT") {
      const guardian = await Parent.findOne({ userId: user._id, schoolId });
      if (!guardian || !guardian.wardIds || guardian.wardIds.length === 0) {
        return { success: true, students: [] };
      }

      const students = await Student.find({
        schoolId,
        _id: { $in: guardian.wardIds },
      })
        .populate("classId", "name section category")
        .sort({ lastName: 1, firstName: 1 });
      return { success: true, students: JSON.parse(JSON.stringify(students)) };
    }

    return { success: false, error: "Invalid role permissions." };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch students.",
    };
  }
}

/**
 * 2. Get Particular Student Profile (Biodata, Grades, Teacher, Class info)
 */
export async function getStudentProfile(
  studentId: string,
  userId: string,
  schoolId: string,
) {
  try {
    const auth = await authorizeStudentAccess(userId, studentId, schoolId);
    if (!auth.authorized) return { success: false, error: auth.error };

    await connectDB();

    // Fetch student with populated class, class teacher, and guardians
    const student = await Student.findOne({ _id: studentId, schoolId })
      .populate({
        path: "classId",
        populate: {
          path: "classTeacherId",
          populate: { path: "userId", select: "name email whatsappNumber" },
        },
      })
      .populate("guardians.guardianId");

    if (!student)
      return { success: false, error: "Student profile not found." };

    // Fetch all grades and assessments for this student
    const grades = await Grade.find({ schoolId, studentId }).populate(
      "assessmentId",
    );

    return {
      success: true,
      student: JSON.parse(JSON.stringify(student)),
      grades: JSON.parse(JSON.stringify(grades)),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch student profile.",
    };
  }
}

/**
 * 3. Get All Grades of a Student
 */
export async function getStudentGrades(
  studentId: string,
  userId: string,
  schoolId: string,
) {
  try {
    const auth = await authorizeStudentAccess(userId, studentId, schoolId);
    if (!auth.authorized) return { success: false, error: auth.error };

    await connectDB();

    const grades = await Grade.find({ schoolId, studentId })
      .populate("assessmentId")
      .sort({ createdAt: -1 });

    return { success: true, grades: JSON.parse(JSON.stringify(grades)) };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch student grades.",
    };
  }
}

/**
 * Helper to verify Admin role
 */
async function verifyAdmin(userId: string, schoolId: string) {
  await connectDB();
  const user = await User.findOne({
    _id: userId,
    schoolId,
    role: "SCHOOL_ADMIN",
  });
  return !!user;
}

/**
 * 1. Register a Single Student (Admin Only)
 */
export async function registerNewStudent(
  userId: string,
  schoolId: string,
  data: {
    admissionNumber: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    dob: string | Date;
    gender: "MALE" | "FEMALE";
    classId: string;
    guardianEmail: string; // Used to link existing guardian or create a placeholder
    medicalFlags?: Array<{
      condition: string;
      severity: "LOW" | "MEDIUM" | "HIGH";
      instructions: string;
    }>;
  },
) {
  try {
    if (!(await verifyAdmin(userId, schoolId))) {
      return { success: false, error: "Unauthorized: Admin access required." };
    }

    await connectDB();

    // Check if admission number already exists in school
    const existing = await Student.findOne({
      schoolId,
      admissionNumber: data.admissionNumber,
    });
    if (existing) {
      return {
        success: false,
        error: "A student with this admission number already exists.",
      };
    }

    // Verify class exists
    const classroom = await Classroom.findOne({ _id: data.classId, schoolId });
    if (!classroom)
      return { success: false, error: "Target classroom not found." };

    // Find linked guardian by email
    const guardian = await Parent.findOne({
      schoolId,
      email: data.guardianEmail.toLowerCase(),
    });

    const guardiansList = guardian
      ? [
          {
            guardianId: guardian._id,
            relationship: "PARENT" as const,
            isPrimaryBillingContact: true,
          },
        ]
      : [];

    const newStudent = await Student.create({
      schoolId: new Types.ObjectId(schoolId),
      admissionNumber: data.admissionNumber.trim(),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      middleName: data.middleName?.trim(),
      dob: new Date(data.dob),
      gender: data.gender,
      classId: new Types.ObjectId(data.classId),
      guardians: guardiansList,
      medicalFlags: data.medicalFlags || [],
      status: "ACTIVE",
    });

    // Add student to classroom array
    await Classroom.findByIdAndUpdate(data.classId, {
      $addToSet: { students: newStudent._id },
    });

    // If guardian exists, add student to their wardIds
    if (guardian) {
      await Parent.findByIdAndUpdate(guardian._id, {
        $addToSet: { wardIds: newStudent._id },
      });
    }

    return { success: true, student: JSON.parse(JSON.stringify(newStudent)) };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to register student.",
    };
  }
}

/**
 * 2. Register Many Students via CSV (Admin Only)
 * Expects CSV headers: admissionNumber, firstName, lastName, gender (MALE/FEMALE), dob (YYYY-MM-DD), classId
 */
export async function registerManyStudents(
  userId: string,
  schoolId: string,
  file: File,
) {
  try {
    if (!(await verifyAdmin(userId, schoolId))) {
      return { success: false, error: "Unauthorized: Admin access required." };
    }

    const parseResult = await parseCSVFile<any>(file);
    if (!parseResult.success || !parseResult.data) {
      return {
        success: false,
        error: parseResult.error || "Failed to parse CSV.",
      };
    }

    await connectDB();
    let successCount = 0;
    const errors: string[] = [];

    for (const row of parseResult.data) {
      if (
        !row.admissionNumber ||
        !row.firstName ||
        !row.lastName ||
        !row.classId
      ) {
        errors.push(
          `Row missing required fields (admissionNumber, firstName, lastName, classId).`,
        );
        continue;
      }

      const exists = await Student.findOne({
        schoolId,
        admissionNumber: row.admissionNumber.toString(),
      });
      if (exists) {
        errors.push(`Admission ${row.admissionNumber}: Already exists.`);
        continue;
      }

      const classroom = await Classroom.findOne({ _id: row.classId, schoolId });
      if (!classroom) {
        errors.push(`Admission ${row.admissionNumber}: Invalid classId.`);
        continue;
      }

      const newStudent = await Student.create({
        schoolId: new Types.ObjectId(schoolId),
        admissionNumber: row.admissionNumber.toString().trim(),
        firstName: row.firstName.trim(),
        lastName: row.lastName.trim(),
        gender: (row.gender || "MALE").toUpperCase(),
        dob: new Date(row.dob || "2010-01-01"),
        classId: classroom._id,
        status: "ACTIVE",
      });

      await Classroom.findByIdAndUpdate(classroom._id, {
        $addToSet: { students: newStudent._id },
      });
      successCount++;
    }

    return {
      success: true,
      successCount,
      errors,
      message: `Successfully registered ${successCount} students.`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Bulk registration failed.",
    };
  }
}

/**
 * 3. Change Student Class (Admin Only)
 * Moves student from old classroom array to new classroom array and updates student.classId
 */
export async function changeStudentClass(
  userId: string,
  schoolId: string,
  studentId: string,
  newClassId: string,
) {
  try {
    if (!(await verifyAdmin(userId, schoolId))) {
      return { success: false, error: "Unauthorized: Admin access required." };
    }

    await connectDB();

    const student = await Student.findOne({ _id: studentId, schoolId });
    if (!student) return { success: false, error: "Student not found." };

    const oldClassId = student.classId;

    const newClassroom = await Classroom.findOne({ _id: newClassId, schoolId });
    if (!newClassroom)
      return { success: false, error: "Destination classroom not found." };

    if (oldClassId?.toString() === newClassId) {
      return { success: false, error: "Student is already in this classroom." };
    }

    // Remove from old classroom
    if (oldClassId) {
      await Classroom.findByIdAndUpdate(oldClassId, {
        $pull: { students: student._id },
      });
    }

    // Add to new classroom
    await Classroom.findByIdAndUpdate(newClassId, {
      $addToSet: { students: student._id },
    });

    // Update student record
    student.classId = new Types.ObjectId(newClassId);
    await student.save();

    return { success: true, message: "Student class updated successfully." };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to change student class.",
    };
  }
}