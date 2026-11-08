import { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  ArrowRight,
  Gauge,
  GraduationCap,
  BookOpen,
  Building2,
  ChevronRight,
  ClipboardCheck,
  FileSpreadsheet,
  Lock,
  Mail,
  Menu,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Edvance — Modern Institutional School Management System",
  description:
    "Operational efficiency for modern academic institutions. Multi-tenant school management software uniting administrators, teachers, parents, and students.",
  openGraph: {
    title: "Edvance — Institutional Education OS",
    description:
      "Secure, data-driven school management system engineered for private primary and secondary institutions.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased selection:bg-[#2563EB] selection:text-white">
      {/* Top Navigation Bar (Fixed, 64-72px height standard) */}
      <header className="sticky top-0 z-50 bg-[#FFFFFF] border-b border-slate-200 h-18 flex items-center shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#172B4D] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              T
            </div>
            <div>
              <span className="font-bold text-[#172B4D] text-lg tracking-tight">
                Edvance
              </span>
              <span className="hidden sm:block text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                Institutional Education OS
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-[#2563EB] transition">
              Features
            </a>
            <a href="#portals" className="hover:text-[#2563EB] transition">
              Role Portals
            </a>
            <a href="#security" className="hover:text-[#2563EB] transition">
              Multi-Tenancy
            </a>
            <a href="#analytics" className="hover:text-[#2563EB] transition">
              Reports
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-block text-sm font-semibold text-[#172B4D] hover:text-[#2563EB] transition px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/login?next=/dashboard"
              className="bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition flex items-center gap-2"
            >
              <span>Access Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-28 overflow-hidden bg-[#FFFFFF] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-semibold tracking-wide uppercase mx-auto lg:mx-0">
                <ShieldCheck className="w-3.5 h-3.5" /> Enterprise Multi-Tenant
                Architecture
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-[#172B4D] tracking-tight leading-[1.15]">
                Operational Efficiency for Modern Academic Institutions.
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                A secure, data-driven school management system engineered to
                streamline administrative workflows, simplify classroom grading,
                and unite Administrators, Teachers, Parents, and Students.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/login"
                  className="bg-[#172B4D] hover:bg-slate-800 text-white font-semibold px-6 py-3.5 rounded-lg shadow-sm text-center transition flex items-center justify-center gap-2"
                >
                  <span>Get Started Now</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <a
                  href="#portals"
                  className="bg-[#FFFFFF] hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold px-6 py-3.5 rounded-lg text-center transition"
                >
                  Explore Portals
                </a>
              </div>

              {/* Quick Trust Metrics (Hidden on very small mobile) */}
              <div className="hidden sm:grid grid-cols-3 gap-6 pt-8 border-t border-slate-100 text-slate-600 text-left">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-[#172B4D]">
                    100%
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Tenant Data Isolation
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-[#172B4D]">
                    &lt; 0.5s
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Bulk CSV Processing
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-[#172B4D]">
                    4 Portals
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Role-Based Security
                  </div>
                </div>
              </div>
            </div>

            {/* Right AI Generated Image / Dashboard Preview */}
            <div className="lg:col-span-5">
              <div className="bg-[#172B4D] rounded-xl shadow-xl border border-slate-800 p-4 sm:p-6 text-white space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    admin_session@tenant_01
                  </span>
                </div>

                {/* AI Generated Image Rendered via Tool Output Tag */}
                <div className="rounded-lg overflow-hidden border border-slate-700 shadow-sm bg-slate-900">
                  x{" "}
                  {/* <Image src="image_generation_content/3759987184379294371" alt="Dashboard interface screenshot for school management" className="w-full h-auto object-cover" /> */}
                </div>

                <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 text-xs text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>CSV Grade batch upload completed.</span>
                  </span>
                  <span className="text-brandBlue font-semibold">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Four Role-Specific Portals Section */}
      <section
        id="portals"
        className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] mb-2">
            Tailored Experiences
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#172B4D] tracking-tight">
            Designed for Every Stakeholder Role
          </h3>
          <p className="text-slate-600 mt-3 text-sm sm:text-base">
            Purpose-built workflows optimized for the daily responsibilities of
            administrators, teachers, parents, and students[cite: 1].
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Admin Portal */}
          <div className="bg-[#FFFFFF] border border-slate-200 rounded-xl p-6 shadow-xs hover:border-[#2563EB] transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center text-xl mb-4 font-bold">
                <Gauge className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-[#172B4D]">
                School Administrator
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Highest Operational Complexity
              </p>
              <p className="text-sm text-slate-600 mt-3">
                Complete institutional oversight: roster management, attendance
                metrics, class configurations, and financial ledgers.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-100 mt-6">
              <span className="text-xs font-semibold text-[#2563EB] flex items-center gap-1">
                Full Control Dashboard <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Teacher Portal */}
          <div className="bg-[#FFFFFF] border border-slate-200 rounded-xl p-6 shadow-xs hover:border-[#2563EB] transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xl mb-4 font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-[#172B4D]">
                Teacher Portal
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Task-Oriented Workflow
              </p>
              <p className="text-sm text-slate-600 mt-3">
                Assigned classrooms, individual grading, bulk CSV grade uploads,
                student performance insights, and announcements[cite: 8].
              </p>
            </div>
            <div className="pt-6 border-t border-slate-100 mt-6">
              <span className="text-xs font-semibold text-[#2563EB] flex items-center gap-1">
                Classroom Tools <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Parent Portal */}
          <div className="bg-[#FFFFFF] border border-slate-200 rounded-xl p-6 shadow-xs hover:border-[#2563EB] transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mb-4 font-bold">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-[#172B4D]">
                Parent Portal
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Simplicity & Transparency
              </p>
              <p className="text-sm text-slate-600 mt-3">
                Switch between linked children, review live term report cards,
                check attendance records, and pay school fees securely[cite: 9].
              </p>
            </div>
            <div className="pt-6 border-t border-slate-100 mt-6">
              <span className="text-xs font-semibold text-[#2563EB] flex items-center gap-1">
                Ward Overview <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Student Portal */}
          <div className="bg-[#FFFFFF] border border-slate-200 rounded-xl p-6 shadow-xs hover:border-[#2563EB] transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xl mb-4 font-bold">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-[#172B4D]">
                Student Portal
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Approachable & Clear
              </p>
              <p className="text-sm text-slate-600 mt-3">
                Self-service view for academic progress, recent assessment
                scores, downloadable transcripts, and announcements[cite: 10].
              </p>
            </div>
            <div className="pt-6 border-t border-slate-100 mt-6">
              <span className="text-xs font-semibold text-[#2563EB] flex items-center gap-1">
                Student Records <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#172B4D] text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white text-[#172B4D] flex items-center justify-center font-bold text-sm">
              T
            </div>
            <div>
              <span className="font-bold text-white text-sm">Edvance</span>
              <span className="block text-[10px] text-slate-400">
                Multi-Tenant School Management System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-white transition">
              Features
            </a>
            <a href="#portals" className="hover:text-white transition">
              Portals
            </a>
            <Link href="/login" className="hover:text-white transition">
              Sign In
            </Link>
          </div>

          <div className="text-slate-500">
            &copy; 2026 Edvance. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
