"use server";

import connectDB from "@/lib/db";
import User from "@/models/user.model";
import { Parent } from "@/models/parent.model";
import { Teacher } from "@/models/teacher.model";
import { School } from "@/models/school.model";

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

    const nameParts = user.name.split(" ");
    const firstName = nameParts[0] || user.name;
    const lastName = nameParts.slice(1).join(" ") || "";

    // Create the Guardian record
    await Parent.create({
      schoolId: user.schoolId,
      userId: user._id,
      firstName,
      lastName,
      email: user.email,
      phone: user.whatsappNumber,
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
    qualification: string;
    specialization: string;
    yearsOfExperience: number;
  },
) {
  try {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) return { success: false, error: "User not found." };

    // TODO: Save to Teacher collection once model is ready
    await Teacher.create({ schoolId: user.schoolId, userId: user._id, ...data });

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

    // Update school branding/details metadata here if necessary

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
