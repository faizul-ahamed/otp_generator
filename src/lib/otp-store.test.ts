import { describe, it, expect, beforeEach } from "vitest";
import { saveOtpRecord, getOtpRecord, incrementOtpAttempts, markOtpAsUsed, checkRateLimit } from "./otp-store";
import { hashOTP } from "./crypto-otp";

describe("Flowtake OTP Store & Rate Limiting Test Suite", () => {
  const email = "test-store@flowtake.com";
  const otp = "654321";
  const otpHash = hashOTP(email, otp);

  beforeEach(async () => {
    // Reset and save fresh record
    await saveOtpRecord(email, otpHash, 300);
  });

  it("stores and retrieves OTP record properly", async () => {
    const record = await getOtpRecord(email);
    expect(record).not.toBeNull();
    expect(record?.email).toBe(email);
    expect(record?.otpHash).toBe(otpHash);
    expect(record?.used).toBe(false);
    expect(record?.attempts).toBe(0);
    expect(record?.maxAttempts).toBe(5);
    expect(record?.expiresAt).toBeGreaterThan(Date.now());
  });

  it("increments attempts count correctly", async () => {
    const res1 = await incrementOtpAttempts(email);
    expect(res1.attempts).toBe(1);

    const res2 = await incrementOtpAttempts(email);
    expect(res2.attempts).toBe(2);

    const record = await getOtpRecord(email);
    expect(record?.attempts).toBe(2);
  });

  it("marks OTP as used and prevents reuse", async () => {
    await markOtpAsUsed(email);
    const record = await getOtpRecord(email);
    expect(record?.used).toBe(true);
  });

  it("enforces rate limits per identifier", async () => {
    const identifier = `test_rate_limit_${Date.now()}`;
    const limit = 3;

    // First request
    const r1 = await checkRateLimit(identifier, limit, 60000);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    // Second request
    const r2 = await checkRateLimit(identifier, limit, 60000);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    // Third request
    const r3 = await checkRateLimit(identifier, limit, 60000);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);

    // Fourth request (Exceeded)
    const r4 = await checkRateLimit(identifier, limit, 60000);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.resetInMs).toBeGreaterThan(0);
  });
});
