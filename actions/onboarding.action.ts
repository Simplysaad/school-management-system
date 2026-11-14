"use server";

import connectDB from "@/lib/db";
import User from "@/models/user.model";
import { Parent } from "@/models/parent.model";
import { Teacher } from "@/models/teacher.model";
import { Student } from "@/models/student.model";
import { School } from "@/models/school.model";
import { Types } from "mongoose";

/**
 * Onboarding Handler for Parents
 */
export async function onboardParent(
  userId: string,
  data: {
    address: string;
    occupation: string;
    alternatePhone?: string;
  },
) {
  try {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) return { success: false, error: "User not found." };

    const nameParts = user.name ? user.name.split(" ") : ["Parent"];
    const firstName = nameParts[0] || "Parent";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Create the Guardian record
    await Parent.create({
      schoolId: user.schoolId,
      userId: user._id,
      firstName,
      lastName,
      email: user.email,
      phone: user.whatsappNumber || "",
      address: data.address,
      occupation: data.occupation,
      alternatePhone: data.alternatePhone,
    });

    // Mark user as onboarded
    user.isOnboarded = true;
    await user.save();

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to complete parent onboarding.",
    };
  }
}

/**
 * Onboarding Handler for Teachers
 */
export async function onboardTeacher(
  userId: string,
  data: {
    employeeId?: string;
    qualification: string;
    specialization: string;
    yearsOfExperience: number;
  },
) {
  try {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) return { success: false, error: "User not found." };

    await Teacher.create({
      schoolId: user.schoolId,
      userId: user._id,
      employeeId: data.employeeId || `TCH-${Date.now().toString().slice(-4)}`,
      qualification: data.qualification,
      specialization: data.specialization,
      yearsOfExperience: data.yearsOfExperience || 0,
    });

    user.isOnboarded = true;
    await user.save();

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to complete teacher onboarding.",
    };
  }
}

/**
 * Onboarding Handler for Students (Linking User account to Student profile)
 */
export async function onboardStudent(
  userId: string,
  data: {
    admissionNumber: string;
  },
) {
  try {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) return { success: false, error: "User not found." };

    // Find student record by school and admission number
    const student = await Student.findOne({
      schoolId: user.schoolId,
      admissionNumber: data.admissionNumber.trim(),
    });

    if (!student) {
      return { success: false, error: "Student record with this admission number was not found in your school." };
    }

    // Optionally link userId to student record if supported by schema, or verify match
    user.isOnboarded = true;
    await user.save();

    return { success: true, student: JSON.parse(JSON.stringify(student)) };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to complete student onboarding.",
    };
  }
}

/**
 * Onboarding Handler for School Administrators
 */
export async function onboardSchoolAdmin(
  userId: string,
  data: {
    schoolName: string;
    schoolAddress: string;
    rcNumber?: string;
  },
) {
  try {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) return { success: false, error: "User not found." };

    // Update school branding and details in the School model
    if (user.schoolId) {
      await School.findByIdAndUpdate(user.schoolId, {
        $set: {
          name: data.schoolName,
          address: data.schoolAddress,
          rcNumber: data.rcNumber || "",
        },
      });
    }

    user.isOnboarded = true;
    await user.save();

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to complete admin onboarding.",
    };
  }
}