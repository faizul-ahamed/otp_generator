"use client";

import React, { useRef, useEffect } from "react";

interface OtpInputProps {
  length?: number;
  value: string[];
  onChange: (value: string[]) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    const sanitized = val.replace(/\D/g, "");

    if (!sanitized) {
      const nextValues = [...value];
      nextValues[index] = "";
      onChange(nextValues);
      return;
    }

    const nextValues = [...value];
    nextValues[index] = sanitized[sanitized.length - 1]; // take the last entered character
    onChange(nextValues);

    // Auto-advance focus to next field if not the last
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if full OTP is filled
    const fullOtp = nextValues.join("");
    if (fullOtp.length === length) {
      onComplete?.(fullOtp);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!value[index] && index > 0) {
        // Move back and clear previous
        const nextValues = [...value];
        nextValues[index - 1] = "";
        onChange(nextValues);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    const cleanNumbers = pastedData.replace(/\D/g, "").slice(0, length);

    if (cleanNumbers.length > 0) {
      const nextValues = [...value];
      for (let i = 0; i < length; i++) {
        nextValues[i] = cleanNumbers[i] || "";
      }
      onChange(nextValues);

      // Focus appropriate input or last
      const focusIndex = Math.min(cleanNumbers.length, length - 1);
      inputRefs.current[focusIndex]?.focus();

      if (cleanNumbers.length === length) {
        onComplete?.(cleanNumbers);
      }
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3 w-full">
      {Array.from({ length }).map((_, index) => {
        const isFilled = Boolean(value[index]);
        return (
          <div key={index} className="relative flex-1 max-w-[54px] aspect-[4/5]">
            <input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={value[index] || ""}
              disabled={disabled}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              className={`w-full h-full text-center text-2xl font-bold font-mono rounded-xl border transition-all duration-200 outline-none select-none
                ${
                  isFilled
                    ? "border-indigo-500 bg-indigo-500/5 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100"
                }
                focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-indigo-500/20 focus:scale-[1.03]
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              aria-label={`Digit ${index + 1}`}
            />
          </div>
        );
      })}
    </div>
  );
}
