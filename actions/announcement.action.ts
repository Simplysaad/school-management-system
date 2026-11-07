"use server";

import connectDB from "@/lib/db";
import { Announcement } from "@/models/announcement.model";
import { User } from "@/models/user.model";
import { Teacher } from "@/models/teacher.model";
import { Parent } from "@/models/parent.model";
import { Student } from "@/models/student.model";
import { Classroom } from "@/models/classroom.model";
import { sendAnnouncementEmail } from "@/lib/email";
import { Types } from "mongoose";

/**
 * 1. Get Announcements Relevant to the Current User
 */
export async function getAnnouncements(userId: string, schoolId: string) {
  try {
    await connectDB();
    const user = await User.findOne({ _id: userId, schoolId });
    if (!user) return { success: false, error: "User not found." };

    let query: any = { schoolId };

    if (user.role === "SCHOOL_ADMIN") {
      // Admins see all announcements
      const announcements = await Announcement.find(query)
        .populate("authorId", "name role email")
        .populate("classId", "name section")
        .sort({ createdAt: -1 });
      return {
        success: true,
        announcements: JSON.parse(JSON.stringify(announcements)),
      };
    }

    if (user.role === "TEACHER") {
      const teacher = await Teacher.findOne({ userId: user._id, schoolId });
      // Teachers see general school-wide announcements, announcements targeted at teachers, or ones they created for their class
      const classrooms = teacher
        ? await Classroom.find({ schoolId, classTeacherId: teacher._id })
        : [];
      const classIds = classrooms.map((c) => c._id);

      query.$or = [
        { targetAudience: "ALL" },
        { targetAudience: "TEACHERS" },
        { authorId: user._id },
        { classId: { $in: classIds } },
      ];

      const announcements = await Announcement.find(query)
        .populate("authorId", "name role email")
        .populate("classId", "name section")
        .sort({ createdAt: -1 });
      return {
        success: true,
        announcements: JSON.parse(JSON.stringify(announcements)),
      };
    }

    if (user.role === "PARENT") {
      const parent = await Parent.findOne({ userId: user._id, schoolId });
      if (!parent || !parent.wardIds || parent.wardIds.length === 0) {
        // Only general announcements if no wards linked
        query.$or = [{ targetAudience: "ALL" }, { targetAudience: "PARENTS" }];
      } else {
        // Find classrooms of all wards/children
        const wards = await Student.find({
          schoolId,
          _id: { $in: parent.wardIds },
        });
        const classIds = wards.map((w) => w.classId).filter(Boolean);

        query.$or = [
          { targetAudience: "ALL" },
          { targetAudience: "PARENTS" },
          { classId: { $in: classIds } },
        ];
      }

      const announcements = await Announcement.find(query)
        .populate("authorId", "name role email")
        .populate("classId", "name section")
        .sort({ createdAt: -1 });
      return {
        success: true,
        announcements: JSON.parse(JSON.stringify(announcements)),
      };
    }

    return { success: false, announcements: [] };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch announcements.",
    };
  }
}

/**
 * 2. Create Announcement
 */
export async function createAnnouncement(
  userId: string,
  schoolId: string,
  data: {
    title: string;
    content: string;
    targetAudience: "ALL" | "CLASS" | "TEACHERS" | "PARENTS";
    classId?: string;
    priority?: "NORMAL" | "HIGH" | "URGENT";
  },
) {
  try {
    await connectDB();
    const user = await User.findOne({ _id: userId, schoolId });
    if (!user) return { success: false, error: "Unauthorized user." };

    // If teacher, ensure they can only target their own class if targetAudience is 'CLASS'
    if (user.role === "TEACHER" && data.targetAudience === "CLASS") {
      const teacher = await Teacher.findOne({ userId: user._id, schoolId });
      const classroom = await Classroom.findOne({
        _id: data.classId,
        schoolId,
        classTeacherId: teacher?._id,
      });
      if (!classroom) {
        return {
          success: false,
          error:
            "Teachers can only publish announcements to their assigned classroom.",
        };
      }
    }

    const announcement = await Announcement.create({
      schoolId: new Types.ObjectId(schoolId),
      title: data.title.trim(),
      content: data.content.trim(),
      authorId: user._id,
      targetAudience: data.targetAudience,
      classId: data.classId ? new Types.ObjectId(data.classId) : undefined,
      priority: data.priority || "NORMAL",
    });

    return {
      success: true,
      announcement: JSON.parse(JSON.stringify(announcement)),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to create announcement.",
    };
  }
}

/**
 * 3. Edit Announcement
 */
export async function editAnnouncement(
  userId: string,
  schoolId: string,
  announcementId: string,
  updateData: {
    title?: string;
    content?: string;
    priority?: "NORMAL" | "HIGH" | "URGENT";
  },
) {
  try {
    await connectDB();
    const user = await User.findOne({ _id: userId, schoolId });
    if (!user) return { success: false, error: "Unauthorized." };

    const query: any = { _id: announcementId, schoolId };
    // Teachers can only edit their own announcements; Admin can edit any
    if (user.role === "TEACHER") {
      query.authorId = user._id;
    }

    const updated = await Announcement.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updated)
      return {
        success: false,
        error: "Announcement not found or unauthorized to edit.",
      };

    return { success: true, announcement: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update announcement.",
    };
  }
}

/**
 * 4. Delete Announcement
 */
export async function deleteAnnouncement(
  userId: string,
  schoolId: string,
  announcementId: string,
) {
  try {
    await connectDB();
    const user = await User.findOne({ _id: userId, schoolId });
    if (!user) return { success: false, error: "Unauthorized." };

    const query: any = { _id: announcementId, schoolId };
    if (user.role === "TEACHER") {
      query.authorId = user._id;
    }

    const deleted = await Announcement.findOneAndDelete(query);
    if (!deleted)
      return {
        success: false,
        error: "Announcement not found or unauthorized to delete.",
      };

    return { success: true, message: "Announcement deleted successfully." };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to delete announcement.",
    };
  }
}

/**
 * 5. Email Announcement to Involved Users
 */
export async function emailAnnouncement(
  userId: string,
  schoolId: string,
  announcementId: string,
) {
  try {
    await connectDB();
    const user = await User.findOne({ _id: userId, schoolId });
    if (!user || (user.role !== "SCHOOL_ADMIN" && user.role !== "TEACHER")) {
      return {
        success: false,
        error: "Unauthorized: Only staff can broadcast announcement emails.",
      };
    }

    const announcement = await Announcement.findOne({
      _id: announcementId,
      schoolId,
    });
    if (!announcement)
      return { success: false, error: "Announcement not found." };

    let recipientEmails: string[] = [];

    if (announcement.targetAudience === "ALL") {
      const users = await User.find({ schoolId, isActive: true }).select(
        "email",
      );
      recipientEmails = users.map((u) => u.email);
    } else if (announcement.targetAudience === "TEACHERS") {
      const teachers = await User.find({
        schoolId,
        role: "TEACHER",
        isActive: true,
      }).select("email");
      recipientEmails = teachers.map((t) => t.email);
    } else if (announcement.targetAudience === "PARENTS") {
      const parents = await User.find({
        schoolId,
        role: "PARENT",
        isActive: true,
      }).select("email");
      recipientEmails = parents.map((p) => p.email);
    } else if (
      announcement.targetAudience === "CLASS" &&
      announcement.classId
    ) {
      // Find students in class, then find their guardians/parents
      const students = await Student.find({
        schoolId,
        classId: announcement.classId,
      }).select("guardians");
      const guardianIds = students.flatMap((s) =>
        s.guardians.map((g: any) => g.guardianId),
      );
      const guardians = await Parent.find({
        _id: { $in: guardianIds },
      }).select("userId");
      const guardianUserIds = guardians.map((g) => g.userId);

      const parentUsers = await User.find({
        _id: { $in: guardianUserIds },
        isActive: true,
      }).select("email");
      recipientEmails = parentUsers.map((p) => p.email);
    }

    if (recipientEmails.length === 0) {
      return {
        success: false,
        error: "No recipients found for this announcement target.",
      };
    }

    const htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #1e40af;">${announcement.title}</h2>
                <p style="white-space: pre-wrap; font-size: 16px;">${announcement.content}</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #666;">Priority: <strong>${announcement.priority}</strong></p>
                <p style="font-size: 12px; color: #666;">Sent from your school portal notification system.</p>
            </div>
        `;

    const emailResult = await sendAnnouncementEmail({
      to: recipientEmails,
      subject: `[Announcement] ${announcement.title}`,
      htmlContent,
    });

    if (!emailResult.success) {
      return { success: false, error: emailResult.error };
    }

    return {
      success: true,
      message: `Announcement emailed successfully to ${recipientEmails.length} recipients.`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to dispatch announcement emails.",
    };
  }
}
