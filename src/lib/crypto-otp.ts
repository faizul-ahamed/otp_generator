import crypto from "crypto";
import { env } from "./config";

/**
 * Generate a cryptographically secure 6-digit numeric OTP.
 * Uses crypto.randomInt for uniform distribution without modulo bias.
 */
export function generateSecureOTP(): string {
  const code = crypto.randomInt(100000, 1000000);
  return code.toString();
}

/**
 * Securely hash the OTP using SHA-256 with an HMAC salt.
 * Ensures the actual OTP is never stored in plaintext in the database.
 */
export function hashOTP(email: string, otp: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  return crypto
    .createHmac("sha256", env.OTP_SECRET)
    .update(`${normalizedEmail}:${otp.trim()}`)
    .digest("hex");
}

/**
 * Timing-safe comparison to prevent timing attacks.
 */
export function verifyOTPHash(email: string, candidateOtp: string, expectedHash: string): boolean {
  if (!candidateOtp || candidateOtp.length !== 6 || !expectedHash) {
    return false;
  }
  const candidateHash = hashOTP(email, candidateOtp);
  const candidateBuf = Buffer.from(candidateHash, "hex");
  const expectedBuf = Buffer.from(expectedHash, "hex");

  if (candidateBuf.length !== expectedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(candidateBuf, expectedBuf);
}

/**
 * Validates standard email format.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim()) && email.length <= 254;
}
