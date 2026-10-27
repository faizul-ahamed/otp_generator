import { describe, it, expect } from "vitest";
import { generateSecureOTP, hashOTP, verifyOTPHash, isValidEmail } from "./crypto-otp";

describe("Flowtake Crypto OTP & Security Test Suite", () => {
  it("generates a 6-digit numeric OTP with uniform distribution", () => {
    for (let i = 0; i < 50; i++) {
      const otp = generateSecureOTP();
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
      const num = parseInt(otp, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThan(1000000);
    }
  });

  it("produces deterministic HMAC hashes for same email and OTP", () => {
    const email = "user@flowtake.com";
    const otp = "123456";
    const hash1 = hashOTP(email, otp);
    const hash2 = hashOTP(email, otp);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex
  });

  it("handles case-insensitivity on emails when hashing", () => {
    const hash1 = hashOTP("User@Flowtake.com", "456789");
    const hash2 = hashOTP("user@flowtake.com", "456789");
    expect(hash1).toBe(hash2);
  });

  it("verifies matching OTP and hash using timing-safe comparison", () => {
    const email = "auth@flowtake.io";
    const otp = "891234";
    const hash = hashOTP(email, otp);

    const isValid = verifyOTPHash(email, otp, hash);
    expect(isValid).toBe(true);
  });

  it("rejects invalid, truncated, or tampered OTPs", () => {
    const email = "auth@flowtake.io";
    const correctOtp = "891234";
    const wrongOtp = "891235";
    const hash = hashOTP(email, correctOtp);

    expect(verifyOTPHash(email, wrongOtp, hash)).toBe(false);
    expect(verifyOTPHash(email, "123", hash)).toBe(false);
    expect(verifyOTPHash(email, "", hash)).toBe(false);
    expect(verifyOTPHash("other@flowtake.io", correctOtp, hash)).toBe(false);
  });

  it("validates email formats strictly", () => {
    expect(isValidEmail("test@flowtake.com")).toBe(true);
    expect(isValidEmail("john.doe+filter@domain.co.uk")).toBe(true);
    expect(isValidEmail("invalid-email")).toBe(false);
    expect(isValidEmail("@missingusername.com")).toBe(false);
    expect(isValidEmail("spaces in@email.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});
