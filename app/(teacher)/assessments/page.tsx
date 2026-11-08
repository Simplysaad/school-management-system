"use client";

import React, { useState, useEffect } from "react";
import { createAssessment, getAssessmentGradeSheet, submitIndividualGrade, bulkUploadGradesFromCSV } from "@/actions/assessment.action";

// Single-tenant default school ID assignment
const DEFAULT_SCHOOL_ID = "6af04b70434f64c2bc56739a";

export default function TeacherAssessmentsPage() {
  const [activeTab, setActiveTab] = useState<"list" | "create" | "gradebook">("list");
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  
  // Gradebook State
  const [gradeSheetData, setGradeSheetData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create Form State
  const [formData, setFormData] = useState({
    academicYear: "2025/2026",
    term: "TERM_1",
    classId: "",
    subjectName: "",
    title: "",
    maxScore: 100,
    weightage: 100,
  });

  // CSV Bulk Upload State
  const [csvText, setCsvText] = useState("");

  // Placeholder user ID from mock session or context
  const userId = "mock_teacher_user_id";

  const loadGradeSheet = async (assessmentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAssessmentGradeSheet(userId, DEFAULT_SCHOOL_ID, assessmentId);
      if (res.success) {
        setGradeSheetData(res);
        setSelectedAssessmentId(assessmentId);
        setActiveTab("gradebook");
      } else {
        setError(res.error || "Failed to load grade sheet.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await createAssessment(userId, DEFAULT_SCHOOL_ID, formData);
      if (res.success) {
        setSuccessMsg("Assessment created successfully!");
        setActiveTab("list");
      } else {
        setError(res.error || "Failed to create assessment.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = async (studentId: string, scoreStr: string, remarks?: string) => {
    const scoreObtained = parseFloat(scoreStr);
    if (isNaN(scoreObtained)) return;

    try {
      const res = await submitIndividualGrade(userId, DEFAULT_SCHOOL_ID, {
        assessmentId: selectedAssessmentId!,
        studentId,
        scoreObtained,
        remarks,
      });

      if (!res.success) {
        alert(res.error || "Failed to update grade");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update grade");
    }
  };

  const handleBulkCSVUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    setLoading(true);
    try {
      // Simple parser for demonstration: expects admissionNumber,scoreObtained,remarks per line
      const lines = csvText.split("\n");
      const records = lines.map((line) => {
        const [admissionNumber, scoreObtained, remarks] = line.split(",").map((s) => s.trim());
        return {
          admissionNumber,
          scoreObtained: Number(scoreObtained),
          remarks: remarks || "",
        };
      }).filter((r) => r.admissionNumber && !isNaN(r.scoreObtained));

      const res = await bulkUploadGradesFromCSV(userId, DEFAULT_SCHOOL_ID, selectedAssessmentId!, records);
      if (res.success) {
        setSuccessMsg(res.message || "Bulk upload completed.");
        loadGradeSheet(selectedAssessmentId!);
      } else {
        setError(res.error || "Bulk upload failed.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold text-[#172B4D]">Assessments & Gradebook</h1>
            <p className="text-sm text-[#64748B] mt-1">Create evaluations, record student scores, or manage spreadsheet gradebooks.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("list")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === "list" ? "bg-[#2563EB] text-white" : "bg-slate-100 text-[#172B4D] hover:bg-slate-200"
              }`}
            >
              Assessments List
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === "create" ? "bg-[#2563EB] text-white" : "bg-slate-100 text-[#172B4D] hover:bg-slate-200"
              }`}
            >
              + Create Assessment
            </button>
          </div>
        </div>

        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-[#DC2626]">{error}</div>}
        {successMsg && <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-[#16A34A]">{successMsg}</div>}

        {/* Tab 1: Assessments List */}
        {activeTab === "list" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#172B4D] mb-4">Active Assessments</h2>
            <p className="text-sm text-[#64748B] mb-6">Select an assessment to view its spreadsheet gradebook and input marks.</p>
            
            {/* Example Assessment Roster Cards / Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#172B4D] uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#172B4D] uppercase">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#172B4D] uppercase">Term / Year</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#172B4D] uppercase">Max Score</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-[#172B4D] uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-[#64748B]">
                      No mock assessments displayed. Create an assessment or connect to active backend classroom list.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Create Assessment Form */}
        {activeTab === "create" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-[#172B4D] mb-4">Create New Assessment</h2>
            <form onSubmit={handleCreateAssessment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#172B4D]">Assessment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Mid-Term Mathematics Exam"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#172B4D]">Subject Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Mathematics"
                    value={formData.subjectName}
                    onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#172B4D]">Class ID</label>
                  <input
                    type="text"
                    required
                    placeholder="Classroom MongoDB ObjectId"
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#172B4D]">Academic Year</label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#172B4D]">Term</label>
                  <select
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none"
                  >
                    <option value="TERM_1">Term 1</option>
                    <option value="TERM_2">Term 2</option>
                    <option value="TERM_3">Term 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#172B4D]">Max Score</label>
                  <input
                    type="number"
                    value={formData.maxScore}
                    onChange={(e) => setFormData({ ...formData, maxScore: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-2.5 px-4 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? "Creating..." : "Save Assessment"}
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Spreadsheet Gradebook & Bulk CSV */}
        {activeTab === "gradebook" && gradeSheetData && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#172B4D]">{gradeSheetData.assessment.title}</h2>
                <p className="text-sm text-[#64748B]">
                  Subject: {gradeSheetData.assessment.subjectName} | Max Score: {gradeSheetData.assessment.maxScore}
                </p>
              </div>
              <button
                onClick={() => setActiveTab("list")}
                className="text-sm text-[#2563EB] font-medium hover:underline"
              >
                &larr; Back to Assessments
              </button>
            </div>

            {/* Bulk CSV Upload Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-base font-semibold text-[#172B4D] mb-2">Bulk Upload Grades via CSV</h3>
              <p className="text-xs text-[#64748B] mb-4">Format: <code className="bg-slate-100 px-1 py-0.5 rounded">admissionNumber, scoreObtained, remarks</code> (one student per line)</p>
              <form onSubmit={handleBulkCSVUpload} className="space-y-4">
                <textarea
                  rows={3}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="ADM001, 85, Excellent work&#10;ADM002, 72, Good effort"
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm font-mono focus:border-[#2563EB] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition"
                >
                  {loading ? "Processing CSV..." : "Upload Batch Grades"}
                </button>
              </form>
            </div>

            {/* Spreadsheet Grid Roster */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-[#F8FAFC]">
                <h3 className="text-base font-semibold text-[#172B4D]">Student Grade Spreadsheet</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[#172B4D] uppercase">Admission No.</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[#172B4D] uppercase">Student Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[#172B4D] uppercase">Score Obtained</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[#172B4D] uppercase">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {gradeSheetData.roster.map(({ student, grade }: any) => (
                      <tr key={student._id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-[#64748B]">
                          {student.admissionNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#172B4D]">
                          {student.lastName}, {student.firstName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            defaultValue={grade ? grade.scoreObtained : ""}
                            placeholder="0"
                            onBlur={(e) => handleScoreChange(student._id, e.target.value, grade?.remarks)}
                            className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-900 focus:border-[#2563EB] focus:outline-none"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            defaultValue={grade ? grade.remarks : ""}
                            placeholder="Optional remarks"
                            onBlur={(e) => handleScoreChange(student._id, e.target.previousElementSibling?.textContent || "0", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}