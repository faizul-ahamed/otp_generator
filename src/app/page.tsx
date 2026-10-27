import { AuthCard } from "@/components/AuthCard";
import { ShieldCheck, Smartphone, Zap, CheckCircle2 } from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex flex-col justify-between overflow-hidden px-4 py-8 sm:py-12">
      {/* Background radial gradients for dynamic SaaS depth */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-indigo-500/20 via-sky-500/15 to-transparent blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[350px] bg-gradient-to-tl from-purple-500/10 via-cyan-500/10 to-transparent blur-[100px] rounded-full" />

      {/* Main Content Container */}
      <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col items-center justify-center">
        {/* Subtle top indicator */}
        <div className="mb-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 text-xs font-medium shadow-sm backdrop-blur-md">
          <ShieldCheck size={14} className="text-indigo-500" />
          <span>Production-Ready Firebase &bull; Flutter Unified Auth</span>
        </div>

        {/* The Auth Modal / Card */}
        <div className="w-full">
          <AuthCard />
        </div>

        {/* Feature highlight badges below auth card */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full text-center sm:text-left">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Instant Delivery
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Powered by Resend transactional engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Smartphone size={18} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Flutter Synced
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Shares same Firebase project & Firestore
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Zero Modulo Bias
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Crypto CSPRNG & timing-safe checks
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Footer */}
      <footer className="w-full max-w-6xl mx-auto pt-8 mt-8 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <p>&copy; 2026 Flowtake Inc. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <span className="hover:text-slate-600 dark:hover:text-slate-300 transition">Privacy</span>
          <span className="hover:text-slate-600 dark:hover:text-slate-300 transition">Security Protocol</span>
          <span className="hover:text-slate-600 dark:hover:text-slate-300 transition">API Documentation</span>
        </div>
      </footer>
    </main>
  );
}
