import { getSession } from "@/actions/user.action";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import { headers } from "next/headers";
import AdminDashboard from "./AdminDashboard";
import TeacherDashboard from "./TeacherDashboard";
import ParentDashboard from "./ParentDashboard";
import StudentDashboard from "./StudentDashboard";

// Single-tenant default school ID assignment
const DEFAULT_SCHOOL_ID = "6af04b70434f64c2bc56739a";

export const metadata = {
  title: "Dashboard | Edvance SaaS",
  description: "Monitor school operations, classes, and academic progress.",
};

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { _id: userId, role, schoolId } = session;

  await connectDB();

  // Role-based routing according to Edvance PRD specifications
  switch (role) {
    case "SCHOOL_ADMIN":
      return (
        <AdminDashboard
          userId={userId}
          schoolId={schoolId || DEFAULT_SCHOOL_ID}
        />
      );

    case "TEACHER":
      return (
        <TeacherDashboard
          userId={userId}
          schoolId={schoolId || DEFAULT_SCHOOL_ID}
        />
      );

    case "PARENT":
      return (
        <ParentDashboard
          userId={userId}
          schoolId={schoolId || DEFAULT_SCHOOL_ID}
        />
      );

    case "STUDENT":
      return (
        <StudentDashboard
          userId={userId}
          schoolId={schoolId || DEFAULT_SCHOOL_ID}
        />
      );

    default:
      redirect("/onboarding");
  }
}