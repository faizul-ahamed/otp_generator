"use client";

import React, { useState, useEffect } from "react";
import { FlowtakeLogo } from "./FlowtakeLogo";
import { OtpInput } from "./OtpInput";
import { ThemeToggle } from "./ThemeToggle";
import {
  Mail,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Sparkles,
  Smartphone,
  LogOut,
  ExternalLink,
} from "lucide-react";
import confetti from "canvas-confetti";
import { auth, googleProvider, isClientFirebaseConfigured } from "@/lib/firebase-client";
import { signInWithPopup, signInWithCustomToken } from "firebase/auth";

type AuthStep = "email" | "otp" | "authenticated";

interface AuthUser {
  uid: string;
  email: string;
  isNewUser?: boolean;
}

export function AuthCard() {
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Request OTP Handler
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please provide a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Unable to send verification code. Please try again.");
        setLoading(false);
        return;
      }

      setStep("otp");
      setCooldown(data.cooldownSeconds || 60);
      setSuccessMsg("Verification code dispatched to your email!");
      if (data.devOtpHint) {
        setDevOtpHint(data.devOtpHint);
      }
    } catch {
      setError("Network error. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP Handler
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: code }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Verification failed. Please check the code.");
        setLoading(false);
        return;
      }

      // If client Firebase is configured and server issued a customToken, exchange it
      if (auth && data.firebaseCustomToken && !data.firebaseCustomToken.startsWith("mock_")) {
        try {
          await signInWithCustomToken(auth, data.firebaseCustomToken);
        } catch (fbErr) {
          console.warn("[Firebase Client] Sign-in with custom token failed:", fbErr);
        }
      }

      setUser(data.user);
      setStep("authenticated");
      setSuccessMsg("Welcome! Authenticated successfully.");

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#6366f1", "#06b6d4", "#a855f7", "#3b82f6"],
        });
      } catch {
        // Safe fallback
      }
    } catch {
      setError("Verification service error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-in Handler
  const handleGoogleSignIn = async () => {
    if (!auth) {
      setError("Google authentication is not yet enabled. Add Firebase keys in .env.local.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      setUser({
        uid: result.user.uid,
        email: result.user.email || "",
        isNewUser: false,
      });
      setStep("authenticated");
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: unknown) {
      const fbErr = err as { message?: string };
      setError(fbErr.message || "Google sign-in was cancelled or encountered an error.");
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      if (auth) {
        await auth.signOut();
      }
      setUser(null);
      setStep("email");
      setOtpDigits(["", "", "", "", "", ""]);
      setDevOtpHint(null);
      setSuccessMsg("Signed out safely.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Background ambient glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-cyan-500/30 rounded-3xl blur-2xl opacity-50 dark:opacity-40 -z-10 transition duration-1000 group-hover:opacity-100 pointer-events-none" />

      {/* Main card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-8 sm:p-10 shadow-2xl shadow-indigo-500/5 transition-all">
        {/* Top Header: Brand + Theme Toggle */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800/60">
          <FlowtakeLogo size={38} />
          <ThemeToggle />
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs sm:text-sm text-rose-600 dark:text-rose-400 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p className="flex-1 font-medium">{error}</p>
          </div>
        )}

        {successMsg && !error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            <p className="flex-1 font-medium">{successMsg}</p>
          </div>
        )}

        {/* Dev Mode Demo Banner */}
        {devOtpHint && (
          <div className="mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <Sparkles size={14} className="text-amber-500" />
              <span>Dev Preview (No Resend Key Configured)</span>
            </div>
            <p className="text-amber-700 dark:text-amber-400/90 leading-relaxed">
              Your test OTP is:{" "}
              <button
                type="button"
                onClick={() => {
                  setOtpDigits(devOtpHint.split(""));
                  handleVerifyOtp(devOtpHint);
                }}
                className="font-mono font-bold tracking-widest text-sm bg-amber-500/20 px-2 py-0.5 rounded cursor-pointer hover:bg-amber-500/30 transition underline"
              >
                {devOtpHint} (Click to Auto-fill)
              </button>
            </p>
          </div>
        )}

        {/* STEP 1: Email Input */}
        {step === "email" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Sign in to Flowtake
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                Enter your email address to receive a secure, passwordless one-time code.
              </p>
            </div>

            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="email-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                >
                  Work or Personal Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    id="email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@flowtake.com"
                    disabled={loading}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 pl-11 pr-4 py-3.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium py-3.5 px-4 shadow-lg shadow-indigo-600/25 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending code...
                  </span>
                ) : (
                  <>
                    <span>Continue with Email</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Alternative Auth divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500 font-semibold">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Alternative */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-950/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium py-3 px-4 transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        )}

        {/* STEP 2: OTP Verification Screen */}
        {step === "otp" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Change email</span>
            </button>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
                <Lock size={12} />
                <span>Verification Code</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Check your inbox
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                We sent a 6-digit one-time code to{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>.
              </p>
            </div>

            {/* OTP Input Boxes */}
            <div className="py-2">
              <OtpInput
                length={6}
                value={otpDigits}
                onChange={setOtpDigits}
                onComplete={(code) => handleVerifyOtp(code)}
                disabled={loading}
              />
            </div>

            {/* Manual Verify Button */}
            <button
              type="button"
              onClick={() => handleVerifyOtp()}
              disabled={loading || otpDigits.join("").length !== 6}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium py-3.5 px-4 shadow-lg shadow-indigo-600/25 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying code...
                </span>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Verify and Sign In</span>
                </>
              )}
            </button>

            {/* Resend OTP & Expiry Timer */}
            <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 gap-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Code expires in 5 minutes
              </span>

              {cooldown > 0 ? (
                <span className="font-medium text-slate-400">
                  Resend in <span className="font-mono text-indigo-500">{cooldown}s</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  disabled={loading}
                  className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw size={13} />
                  <span>Resend code</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Authenticated Screen */}
        {step === "authenticated" && user && (
          <div className="space-y-6 text-center animate-in zoom-in-95 duration-400">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-white shadow-xl shadow-emerald-500/20">
              <ShieldCheck size={32} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Authentication Successful
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Connected securely to Flowtake
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-4 text-left space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  User Email
                </span>
                <p className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {user.email}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Firebase UID (Shared with Flutter App)
                </span>
                <p className="font-mono text-xs font-medium text-indigo-600 dark:text-indigo-400 break-all">
                  {user.uid}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Smartphone size={13} className="text-cyan-500" />
                  Flutter Sync Ready
                </span>
                <span className="font-medium text-emerald-500">Session Active</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium py-3 px-4 transition cursor-pointer"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Card Footer Security Badge */}
        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1.5">
            <Lock size={12} className="text-emerald-500" />
            End-to-End Cryptographic OTP
          </span>
          <span className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-400 transition cursor-default">
            Flowtake v2.0
          </span>
        </div>
      </div>
    </div>
  );
}
