

import React from 'react';
import Link from 'next/link';
import connectDB from "@/lib/db";
import { getSession } from "@/actions/user.action";
import { redirect } from "next/navigation";

// Single-tenant default school ID assignment
// const DEFAULT_SCHOOL_ID = "6af04b70434f64c2bc56739a";

export default async function TeacherDashboardPage({
  userId,
  schoolId,
}: {
  userId: string;
  schoolId: string;
}) {
  const session = await getSession();

  if (!session || session.role !== "TEACHER") {
    redirect("/login");
  }

  await connectDB();

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-[#172B4D] text-lg tracking-tight">EDVANCE</span>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-medium text-[#64748B]">Teacher Portal</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xs font-medium bg-blue-50 text-[#2563EB] px-3 py-1 rounded-full">
            Teacher Workspace
          </span>
          <span className="text-sm font-medium text-[#172B4D]">{session.firstName} {session.lastName}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
        {/* Welcome & Biodata Section */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#172B4D]">Welcome back, {session.firstName}!</h1>
            <p className="text-sm text-[#64748B] mt-1">
              Here is your daily overview of assigned classrooms, student metrics, and pending evaluations.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/teacher/attendance"
              className="px-4 py-2 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Take Today's Attendance
            </Link>
            <Link
              href="/dashboard/teacher/assessments"
              className="px-4 py-2 bg-white border border-slate-300 text-[#172B4D] text-sm font-medium rounded-lg hover:bg-slate-50 transition"
            >
              Grade Assessments
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Assigned Classrooms</p>
            <p className="text-3xl font-semibold text-[#172B4D] mt-2">3</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Total Students Supervised</p>
            <p className="text-3xl font-semibold text-[#172B4D] mt-2">114</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Pending Assessments</p>
            <p className="text-3xl font-semibold text-[#D97706] mt-2">2</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Class Attendance (Today)</p>
            <p className="text-3xl font-semibold text-[#16A34A] mt-2">96%</p>
          </div>
        </div>

        {/* Main Workspace Navigation / Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Assessments & Grading */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold mb-4">
                📊
              </div>
              <h2 className="text-lg font-semibold text-[#172B4D]">Assessments & Grading</h2>
              <p className="text-sm text-[#64748B] mt-1">
                Create new assessments, upload scores via bulk CSV templates, or edit student marks inline like a spreadsheet.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link href="/dashboard/teacher/assessments" className="text-sm font-medium text-[#2563EB] hover:underline">
                Open Gradebook &rarr;
              </Link>
            </div>
          </div>

          {/* Card 2: Daily Attendance */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-green-50 text-[#16A34A] flex items-center justify-center font-bold mb-4">
                📋
              </div>
              <h2 className="text-lg font-semibold text-[#172B4D]">Daily Attendance</h2>
              <p className="text-sm text-[#64748B] mt-1">
                Record and verify student presence across your assigned classrooms with status tagging (Present, Absent, Late).
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link href="/dashboard/teacher/attendance" className="text-sm font-medium text-[#2563EB] hover:underline">
                Mark Attendance &rarr;
              </Link>
            </div>
          </div>

          {/* Card 3: Class Announcements */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-[#D97706] flex items-center justify-center font-bold mb-4">
                📢
              </div>
              <h2 className="text-lg font-semibold text-[#172B4D]">Class Announcements</h2>
              <p className="text-sm text-[#64748B] mt-1">
                Broadcast announcements directly to parents and students in your assigned classes with priority indicators.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link href="/dashboard/teacher/announcements" className="text-sm font-medium text-[#2563EB] hover:underline">
                Manage Broadcasts &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}