"use client";

import { useState } from "react";
import { registerUser, completeOnboarding } from "@/actions/user.action";
import { useRouter } from "next/navigation";
import { UserCheck, Lock, Mail, User, Briefcase, MapPin, Phone, Building } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [registeredUser, setRegisteredUser] = useState<any>(null);

    // Form states
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "PARENT",
        schoolId: "650f19c41234567890abcdef", // Mock or dynamically bound school ID
    });

    const [onboardingData, setOnboardingData] = useState({
        phone: "",
        address: "",
        occupation: "",
        alternatePhone: "",
    });

    const handleStep1Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await registerUser(formData);
        setLoading(false);

        if (!res.success) {
            setError(res.error || "Registration error");
            return;
        }

        setRegisteredUser(res.user);
        setStep(2); // Move to role-specific onboarding
    };

    const handleStep2Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await completeOnboarding(registeredUser._id, onboardingData);
        setLoading(false);

        if (!res.success) {
            setError(res.error || "Onboarding failed");
            return;
        }

        // Route to respective dashboard depending on role
        router.push(`/dashboard/${formData.role.toLowerCase()}`);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6">
                
                {/* Header */}
                <div className="text-center space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        {step === 1 ? "Create Account" : "Complete Profile Onboarding"}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {step === 1 ? "Step 1 of 2: Basic Credentials" : `Step 2 of 2: ${formData.role} Details`}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* STEP 1: Core User Info */}
                {step === 1 && (
                    <form onSubmit={handleStep1Submit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-600">First Name</label>
                                <div className="relative mt-1">
                                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                        placeholder="John"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600">Last Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 mt-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    placeholder="Doe"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-600">Email Address</label>
                            <div className="relative mt-1">
                                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-600">Password</label>
                            <div className="relative mt-1">
                                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-600">Select Role</label>
                            <select
                                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="PARENT">Parent / Guardian</option>
                                <option value="TEACHER">Teacher</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition disabled:opacity-50"
                        >
                            {loading ? "Creating account..." : "Continue to Onboarding"}
                        </button>
                    </form>
                )}

                {/* STEP 2: Role Specific Onboarding (e.g. Parent Attributes) */}
                {step === 2 && formData.role === "PARENT" && (
                    <form onSubmit={handleStep2Submit} className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-600">Phone Number</label>
                            <div className="relative mt-1">
                                <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="tel"
                                    required
                                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    placeholder="+234 800 000 0000"
                                    value={onboardingData.phone}
                                    onChange={(e) => setOnboardingData({ ...onboardingData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-600">Residential Address</label>
                            <div className="relative mt-1">
                                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    placeholder="123 Education Lane"
                                    value={onboardingData.address}
                                    onChange={(e) => setOnboardingData({ ...onboardingData, address: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-600">Occupation</label>
                            <div className="relative mt-1">
                                <Briefcase className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    placeholder="Software Engineer"
                                    value={onboardingData.occupation}
                                    onChange={(e) => setOnboardingData({ ...onboardingData, occupation: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition disabled:opacity-50"
                        >
                            {loading ? "Saving profile..." : "Complete Registration"}
                        </button>
                    </form>
                )}

            </div>
        </div>
    );
}