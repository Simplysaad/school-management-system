// src/lib/auth-guard.ts
import connectDB from "@/lib/db";
import { User } from "@/models/user.model";
import { Teacher } from "@/models/teacher.model";
import { Classroom } from "@/models/classroom.model";
import { Types } from "mongoose";

export async function authorizeGrading(userId: string, targetClassId: string, schoolId: string) {
    await connectDB();
    const user = await User.findOne({ _id: userId, schoolId });
    if (!user) return { authorized: false, error: "User session invalid." };

    // School Admins have global permission across all classes
    if (user.role === "SCHOOL_ADMIN") {
        return { authorized: true, user };
    }

    // Teachers must be assigned as class teacher or teach this classroom
    if (user.role === "TEACHER") {
        const teacher = await Teacher.findOne({ userId: user._id, schoolId });
        if (!teacher) return { authorized: false, error: "Teacher profile not found." };

        const classroom = await Classroom.findOne({
            _id: targetClassId,
            schoolId,
            classTeacherId: teacher._id,
        });

        if (!classroom) {
            return {
                authorized: false,
                error: "Access denied: You are only authorized to grade students in your assigned classroom.",
            };
        }

        return { authorized: true, user, teacher };
    }

    return { authorized: false, error: "Unauthorized access." };
}