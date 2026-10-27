import React from "react";

interface FlowtakeLogoProps {
  className?: string;
  size?: number;
}

export function FlowtakeLogo({ className = "", size = 40 }: FlowtakeLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 transition-transform duration-300 hover:scale-105"
      >
        <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950/80 backdrop-blur-md">
          {/* Custom geometric Flowtake icon: intersecting kinetic arrows / flow */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-3/5 h-3/5 text-transparent"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <defs>
              <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
            <path d="M4 12h12M12 6l6 6-6 6" stroke="url(#flowGradient)" />
            <path d="M4 6h4M4 18h4" stroke="url(#flowGradient)" strokeOpacity="0.6" />
          </svg>
        </div>
      </div>
      <div className="flex flex-col text-left">
        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
          Flowtake
        </span>
        <span className="text-[10px] font-semibold tracking-widest uppercase text-indigo-500/90 dark:text-indigo-400">
          Secure Identity
        </span>
      </div>
    </div>
  );
}
