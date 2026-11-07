import { redirect } from "next/navigation";
import { getSession } from "@/actions/user.action";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import ParentOnboardingForm from "./ParentOnboardingForm";
import TeacherOnboardingForm from "./TeacherOnboardingForm";
import AdminOnboardingForm from "./AdminOnboardingForm";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const user = await User.findById(session.id);

  if (!user) redirect("/login");

  // If already onboarded, send them straight to their designated dashboard
  if (user.isOnboarded) {
    redirect(`/dashboard`);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          Complete Your {user.role.replace("_", " ")} Profile
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600">
          We just need a few more details to set up your account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        {user.role === "PARENT" && (
          <ParentOnboardingForm userId={user._id.toString()} />
        )}
        {user.role === "TEACHER" && (
          <TeacherOnboardingForm userId={user._id.toString()} />
        )}
        {user.role === "SCHOOL_ADMIN" && (
          <AdminOnboardingForm userId={user._id.toString()} />
        )}
      </div>
    </div>
  );
}
