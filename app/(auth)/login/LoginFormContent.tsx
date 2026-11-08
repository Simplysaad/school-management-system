"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser } from "@/actions/user.action";
import { Loader2, Lock, Mail } from "lucide-react";
import Link from "next/link";

export default function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await loginUser({ email, password });

      if (!res.success) {
        setError(res.error || "Invalid email or password.");
        setLoading(false);
        return;
      }

      if (nextUrl && nextUrl.startsWith("/")) {
        router.push(nextUrl);
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleLogin}>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 text-xs text-red-700 rounded-r-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-700">
          Email Address
        </label>
        <div className="mt-1 relative rounded-md shadow-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
            placeholder="name@institution.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          Password
        </label>
        <div className="mt-1 relative rounded-md shadow-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#172B4D] hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#172B4D] disabled:opacity-50 transition"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Sign In"
          )}
        </button>
      </div>

      <div className="text-center pt-2">
        <p className="text-xs text-slate-600">
          Need to register a school tenant?{" "}
          <Link href="/register" className="font-semibold text-[#2563EB] hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </form>
  );
}