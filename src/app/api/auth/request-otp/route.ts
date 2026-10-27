import { NextRequest, NextResponse } from "next/server";
import { isValidEmail, generateSecureOTP, hashOTP } from "@/lib/crypto-otp";
import { saveOtpRecord, checkRateLimit, getOtpRecord } from "@/lib/otp-store";
import { sendOtpEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const body = await req.json().catch(() => ({}));
    const email = body.email;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. IP Rate Limiting (10 requests per 15 minutes per IP)
    const ipRateLimit = await checkRateLimit(`ip_${ip}`, 10, 15 * 60 * 1000);
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many OTP requests from this device. Please wait a few minutes before trying again.",
          retryAfterMs: ipRateLimit.resetInMs,
        },
        { status: 429 }
      );
    }

    // 2. Email Rate Limiting (5 requests per 15 minutes per email)
    const emailRateLimit = await checkRateLimit(`email_${normalizedEmail}`, 5, 15 * 60 * 1000);
    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests for this email address. Please try again later.",
          retryAfterMs: emailRateLimit.resetInMs,
        },
        { status: 429 }
      );
    }

    // 3. Resend Cooldown Check (must wait at least 60 seconds between resends)
    const existing = await getOtpRecord(normalizedEmail);
    if (existing && !existing.used && existing.resendAfter > Date.now()) {
      const waitSeconds = Math.ceil((existing.resendAfter - Date.now()) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `Please wait ${waitSeconds}s before requesting a new code.`,
          retryAfterMs: existing.resendAfter - Date.now(),
        },
        { status: 429 }
      );
    }

    // 4. Generate cryptographically random 6-digit OTP
    const rawOtp = generateSecureOTP();
    const otpHash = hashOTP(normalizedEmail, rawOtp);

    // 5. Store hashed OTP in database with 5 min (300s) TTL
    // (This invalidates any previous unverified OTP for this email)
    await saveOtpRecord(normalizedEmail, otpHash, 300);

    // 6. Deliver OTP via Resend email service
    const mailResult = await sendOtpEmail(normalizedEmail, rawOtp);

    if (!mailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to deliver verification code. Please verify your email or try again.",
        },
        { status: 502 }
      );
    }

    // 7. Security: never expose OTP in production.
    // If running in local dev mode without an email key, provide dev preview helper
    return NextResponse.json({
      success: true,
      message: "A verification code has been dispatched to your email.",
      cooldownSeconds: 60,
      devMode: mailResult.devMode ? true : false,
      devOtpHint: mailResult.devMode ? rawOtp : undefined,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[OTP Request Error]:", message, error);
    return NextResponse.json(
      { success: false, error: `Authentication service error: ${message}` },
      { status: 500 }
    );
  }
}
