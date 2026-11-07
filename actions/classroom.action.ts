"use server";

import connectDB from "@/lib/db";
import { Classroom } from "@/models/classroom.model";
import { Student } from "@/models/student.model"; // adjust path as needed based on your structure
import mongoose, { Types } from "mongoose";

/**
 * 1. Create Classroom
 */
export async function createClassroom(schoolId: string, data: {
    name: string;
    section?: string;
    category: 'PRIMARY' | 'SECONDARY' | 'KINDERGARTEN';
    capacity?: number;
    classTeacherId?: string;
}) {
    try {
        await connectDB();

        const newClassroom = await Classroom.create({
            schoolId: new Types.ObjectId(schoolId),
            name: data.name,
            section: data.section,
            category: data.category,
            capacity: data.capacity || 40,
            classTeacherId: data.classTeacherId ? new Types.ObjectId(data.classTeacherId) : undefined,
        });

        return { success: true, classroom: JSON.parse(JSON.stringify(newClassroom)) };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to create classroom." };
    }
}

/**
 * 2. Edit Classroom
 */
export async function editClassroom(classroomId: string, schoolId: string, updateData: {
    name?: string;
    section?: string;
    category?: 'PRIMARY' | 'SECONDARY' | 'KINDERGARTEN';
    capacity?: number;
    classTeacherId?: string;
}) {
    try {
        await connectDB();

        const updated = await Classroom.findOneAndUpdate(
            { _id: classroomId, schoolId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return { success: false, error: "Classroom not found." };
        }

        return { success: true, classroom: JSON.parse(JSON.stringify(updated)) };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to update classroom." };
    }
}

/**
 * 3. Add Student to Classroom
 */
export async function addStudentToClassroom(classroomId: string, studentId: string, schoolId: string) {
    try {
        await connectDB();

        // Check classroom capacity and existence
        const classroom = await Classroom.findOne({ _id: classroomId, schoolId });
        if (!classroom) return { success: false, error: "Classroom not found." };

        if (classroom.students.length >= classroom.capacity) {
            return { success: false, error: "Classroom has reached maximum capacity." };
        }

        // Update Student's classId
        const studentUpdate = await Student.findOneAndUpdate(
            { _id: studentId, schoolId },
            { $set: { classId: new Types.ObjectId(classroomId) } },
            { new: true }
        );

        if (!studentUpdate) {
            return { success: false, error: "Student not found under this school." };
        }

        // Add student._id to classroom.students (using $addToSet to prevent duplicates)
        await Classroom.findByIdAndUpdate(classroomId, {
            $addToSet: { students: new Types.ObjectId(studentId) }
        });

        return { success: true, message: "Student added to classroom successfully." };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to add student to classroom." };
    }
}

/**
 * 4. Remove Student from Classroom
 */
export async function removeStudentFromClassroom(classroomId: string, studentId: string, schoolId: string) {
    try {
        await connectDB();

        // Unset or remove classId from student
        const studentUpdate = await Student.findOneAndUpdate(
            { _id: studentId, schoolId },
            { $unset: { classId: "" } },
            { new: true }
        );

        if (!studentUpdate) {
            return { success: false, error: "Student not found." };
        }

        // Remove student._id from classroom.students
        await Classroom.findByIdAndUpdate(classroomId, {
            $pull: { students: new Types.ObjectId(studentId) }
        });

        return { success: true, message: "Student removed from classroom successfully." };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to remove student from classroom." };
    }
}



/**
 * 5. Get All Classrooms by School
 */
export async function getClassroomsBySchool(schoolId: string) {
    try {
        await connectDB();

        const classrooms = await Classroom.find({ schoolId })
            .populate("classTeacherId", "employeeId qualification")
            .populate({
                path: "classTeacherId",
                populate: { path: "userId", select: "name email whatsappNumber" }
            })
            .sort({ name: 1, section: 1 });

        return { success: true, classrooms: JSON.parse(JSON.stringify(classrooms)) };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch classrooms." };
    }
}

/**
 * 6. Get Classroom Details with Populated Roster & Teacher Info
 */
export async function getClassroomDetails(classroomId: string, schoolId: string) {
    try {
        await connectDB();

        if (!mongoose.Types.ObjectId.isValid(classroomId)) {
            return { success: false, error: "Invalid classroom ID." };
        }

        const classroom = await Classroom.findOne({ _id: classroomId, schoolId })
            .populate("classTeacherId")
            .populate({
                path: "classTeacherId",
                populate: { path: "userId", select: "name email whatsappNumber" }
            })
            .populate({
                path: "students",
                select: "admissionNumber firstName lastName gender status medicalFlags"
            });

        if (!classroom) {
            return { success: false, error: "Classroom not found." };
        }

        return { success: true, classroom: JSON.parse(JSON.stringify(classroom)) };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch classroom details." };
    }
}

/**
 * 7. Assign Class Teacher
 */
export async function assignClassTeacher(classroomId: string, teacherId: string, schoolId: string) {
    try {
        await connectDB();

        const updated = await Classroom.findOneAndUpdate(
            { _id: classroomId, schoolId },
            { $set: { classTeacherId: new Types.ObjectId(teacherId) } },
            { new: true }
        );

        if (!updated) {
            return { success: false, error: "Classroom not found." };
        }

        return { success: true, message: "Class teacher assigned successfully." };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to assign class teacher." };
    }
}

/**
 * 8. Delete Classroom (Safely unassigns students first)
 */
export async function deleteClassroom(classroomId: string, schoolId: string) {
    try {
        await connectDB();

        const classroom = await Classroom.findOne({ _id: classroomId, schoolId });
        if (!classroom) {
            return { success: false, error: "Classroom not found." };
        }

        // Check if there are active students still assigned to this room
        if (classroom.students && classroom.students.length > 0) {
            return { 
                success: false, 
                error: "Cannot delete classroom containing active students. Please reassign or remove them first." 
            };
        }

        await Classroom.findOneAndDelete({ _id: classroomId, schoolId });

        return { success: true, message: "Classroom deleted successfully." };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to delete classroom." };
    }
} 