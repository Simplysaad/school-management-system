"use server";

import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import User, { IUser } from "@/models/user.model";
import { Parent } from "@/models/parent.model";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const SESSION_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

async function setUserSessionCookie(user: Record<string, any>) {
  const cookieStore = await cookies();
  const sessionData = JSON.stringify({
    id: user._id,
    email: user.email,
    role: user.role,
    name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    schoolId: user.schoolId,
  });

  cookieStore.set("session", sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + SESSION_EXPIRATION_MS),
  });
}

export async function registerUser(formData: {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: string;
  schoolId: string;
}) {
  try {
    await connectDB();

    const userExists = await User.findOne({ email: formData.email }).select(
      "_id email role",
    );
    if (userExists) {
      return {
        success: false,
        error: "This email is already registered. Please log in.",
      };
    }

    if (!formData.password) {
      return {
        success: false,
        error: "Password is required for registration.",
      };
    }

    const hashedPassword = await bcrypt.hash(formData.password, 10);

    // Create the base user
    const newUser = await User.create({
      ...formData,
      password: hashedPassword, // matching your mongoose schema naming convention
    });

    const sanitizedUser = JSON.parse(JSON.stringify(newUser));
    delete sanitizedUser.password;

    await setUserSessionCookie(sanitizedUser);

    return { success: true, user: sanitizedUser };
  } catch (error: any) {
    return { success: false, error: error.message || "Registration failed" };
  }
}

/**
 * Step 2: Role-Specific Onboarding
 */

export async function loginUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  try {
    await connectDB();
    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.password) {
      return { success: false, error: "Invalid email or password" };
    }

    const isCorrectPassword = await bcrypt.compare(password, user.password);
    if (!isCorrectPassword) {
      return { success: false, error: "Invalid email or password" };
    }

    const sanitizedUser = JSON.parse(JSON.stringify(user));
    delete sanitizedUser.password;

    await setUserSessionCookie(sanitizedUser);
    return { success: true, user: sanitizedUser };
  } catch (error: any) {
    return { success: false, error: error.message || "Login failed" };
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return null;
  try {
    return JSON.parse(sessionCookie);
  } catch {
    return null;
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  return { success: true };
}

export async function completeOnboarding(userId: string, roleData: any) {
  try {
    await connectDB();
    const user = await User.findById(userId);

    if (!user) {
      return { success: false, error: "User session reference not found." };
    }

    if (user.role === "PARENT") {
      // Create corresponding Parent document
      await Parent.create({
        schoolId: user.schoolId,
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: roleData.phone,
        address: roleData.address,
        occupation: roleData.occupation,
        alternatePhone: roleData.alternatePhone,
      });
    }
    // Add conditions here later for TEACHER, STUDENT profile collections if needed.

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Onboarding failed" };
  }
}
