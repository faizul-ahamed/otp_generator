export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { isValidEmail, verifyOTPHash } from "@/lib/crypto-otp";
import { getOtpRecord, incrementOtpAttempts, markOtpAsUsed, checkRateLimit } from "@/lib/otp-store";
import { syncUserAndIssueToken } from "@/lib/user-service";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const body = await req.json().catch(() => ({}));
    const { email, otp } = body;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (!otp || typeof otp !== "string" || !/^\d{6}$/.test(otp.trim())) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 6-digit verification code." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    // 1. IP Rate Limiting on verification endpoint to prevent brute force (15 attempts per 15 mins)
    const ipLimit = await checkRateLimit(`verify_ip_${ip}`, 15, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many verification attempts from this IP address. Please wait a few minutes.",
        },
        { status: 429 }
      );
    }

    // 2. Retrieve OTP record
    const record = await getOtpRecord(normalizedEmail);

    if (!record) {
      return NextResponse.json(
        { success: false, error: "No active verification code found. Please request a new code." },
        { status: 400 }
      );
    }

    const now = Date.now();

    // 3. Expiry check (5-minute expiration)
    if (record.expiresAt < now) {
      return NextResponse.json(
        { success: false, error: "This verification code has expired. Please request a new one." },
        { status: 410 }
      );
    }

    // 4. Replay attack check (single use)
    if (record.used) {
      return NextResponse.json(
        { success: false, error: "This code has already been used. Please request a new code." },
        { status: 409 }
      );
    }

    // 5. Attempt limits (maximum 5 attempts)
    if (record.attempts >= record.maxAttempts) {
      return NextResponse.json(
        {
          success: false,
          error: "Maximum verification attempts exceeded. Please request a new verification code.",
        },
        { status: 403 }
      );
    }

    // 6. Timing-safe cryptographic hash comparison
    const isMatch = verifyOTPHash(normalizedEmail, cleanOtp, record.otpHash);

    if (!isMatch) {
      const { attempts, maxAttempts } = await incrementOtpAttempts(normalizedEmail);
      const remainingAttempts = Math.max(0, maxAttempts - attempts);

      return NextResponse.json(
        {
          success: false,
          error:
            remainingAttempts > 0
              ? `Invalid code. ${remainingAttempts} attempt${remainingAttempts > 1 ? "s" : ""} remaining.`
              : "Too many incorrect attempts. Code invalidated. Please request a new code.",
          remainingAttempts,
        },
        { status: 400 }
      );
    }

    // 7. Mark OTP as used atomically to prevent reuse
    await markOtpAsUsed(normalizedEmail);

    // 8. Sync or create user in Firebase Auth and issue custom token
    const userSession = await syncUserAndIssueToken(normalizedEmail);

    // 9. Create HTTP-only session cookie for web app persistence
    const response = NextResponse.json({
      success: true,
      message: "Authentication successful.",
      user: {
        uid: userSession.uid,
        email: userSession.email,
        isNewUser: userSession.isNewUser,
      },
      firebaseCustomToken: userSession.customToken,
    });

    // Set secure cookie
    response.cookies.set("flowtake_auth_session", userSession.uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: unknown) {
    console.error("[OTP Verify Error]:", error);
    return NextResponse.json(
      { success: false, error: "Verification failed due to a server error. Please try again." },
      { status: 500 }
    );
  }
}
