import { getFirebaseAdmin } from "./firebase-admin";

export interface OtpRecord {
  email: string;
  otpHash: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  used: boolean;
  resendAfter: number;
}

export interface RateLimitRecord {
  requests: number;
  firstRequestTime: number;
}

// In-process fallback store when Firestore credentials are not yet supplied
const globalFallbackStore = global as unknown as {
  _otpStore?: Map<string, OtpRecord>;
  _rateLimitStore?: Map<string, RateLimitRecord>;
};
if (!globalFallbackStore._otpStore) {
  globalFallbackStore._otpStore = new Map<string, OtpRecord>();
}
if (!globalFallbackStore._rateLimitStore) {
  globalFallbackStore._rateLimitStore = new Map<string, RateLimitRecord>();
}

const memoryStore = globalFallbackStore._otpStore;
const memoryRateLimits = globalFallbackStore._rateLimitStore;

const OTP_COLLECTION = "flowtake_otp_records";
const RATE_LIMIT_COLLECTION = "flowtake_rate_limits";

function cleanupMemoryStore() {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (record.expiresAt < now || record.used) {
      memoryStore.delete(key);
    }
  }
}

function memoryCheckRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const existing = memoryRateLimits.get(identifier);
  if (!existing || now - existing.firstRequestTime > windowMs) {
    memoryRateLimits.set(identifier, { requests: 1, firstRequestTime: now });
    return { allowed: true, remaining: limit - 1, resetInMs: windowMs };
  }

  if (existing.requests >= limit) {
    const resetInMs = Math.max(0, existing.firstRequestTime + windowMs - now);
    return { allowed: false, remaining: 0, resetInMs };
  }

  existing.requests += 1;
  return {
    allowed: true,
    remaining: limit - existing.requests,
    resetInMs: Math.max(0, existing.firstRequestTime + windowMs - now),
  };
}

export async function checkRateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000
): Promise<{ allowed: boolean; remaining: number; resetInMs: number }> {
  try {
    const { db, isAvailable } = getFirebaseAdmin();
    const now = Date.now();

    if (isAvailable && db) {
      const docRef = db.collection(RATE_LIMIT_COLLECTION).doc(identifier.replace(/[^a-zA-Z0-9_-]/g, "_"));
      return await db.runTransaction(async (t) => {
        const snap = await t.get(docRef);
        if (!snap.exists) {
          t.set(docRef, { requests: 1, firstRequestTime: now, expiresAt: now + windowMs });
          return { allowed: true, remaining: limit - 1, resetInMs: windowMs };
        }
        const data = snap.data() as RateLimitRecord & { expiresAt: number };
        if (now - data.firstRequestTime > windowMs) {
          t.set(docRef, { requests: 1, firstRequestTime: now, expiresAt: now + windowMs });
          return { allowed: true, remaining: limit - 1, resetInMs: windowMs };
        }

        if (data.requests >= limit) {
          const resetInMs = Math.max(0, data.firstRequestTime + windowMs - now);
          return { allowed: false, remaining: 0, resetInMs };
        }

        t.update(docRef, { requests: data.requests + 1 });
        return {
          allowed: true,
          remaining: limit - (data.requests + 1),
          resetInMs: Math.max(0, data.firstRequestTime + windowMs - now),
        };
      });
    }
  } catch (err) {
    console.warn("[RateLimit Store] Fallback to memory due to:", err);
  }

  return memoryCheckRateLimit(identifier, limit, windowMs);
}

export async function saveOtpRecord(
  email: string,
  otpHash: string,
  ttlSeconds: number = 300
): Promise<OtpRecord> {
  const normalizedEmail = email.trim().toLowerCase();
  const now = Date.now();
  const record: OtpRecord = {
    email: normalizedEmail,
    otpHash,
    createdAt: now,
    expiresAt: now + ttlSeconds * 1000,
    attempts: 0,
    maxAttempts: 5,
    used: false,
    resendAfter: now + 60 * 1000,
  };

  try {
    const { db, isAvailable } = getFirebaseAdmin();
    if (isAvailable && db) {
      const docRef = db.collection(OTP_COLLECTION).doc(normalizedEmail);
      await docRef.set(record);
      return record;
    }
  } catch (err) {
    console.warn("[Otp Store] Falling back to memory store:", err);
  }

  cleanupMemoryStore();
  memoryStore.set(normalizedEmail, record);
  return record;
}

export async function getOtpRecord(email: string): Promise<OtpRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const { db, isAvailable } = getFirebaseAdmin();
    if (isAvailable && db) {
      const docRef = db.collection(OTP_COLLECTION).doc(normalizedEmail);
      const snap = await docRef.get();
      if (!snap.exists) return null;
      return snap.data() as OtpRecord;
    }
  } catch (err) {
    console.warn("[Otp Store] getOtpRecord fallback to memory:", err);
  }

  return memoryStore.get(normalizedEmail) || null;
}

export async function incrementOtpAttempts(email: string): Promise<{ attempts: number; maxAttempts: number }> {
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const { db, isAvailable } = getFirebaseAdmin();
    if (isAvailable && db) {
      const docRef = db.collection(OTP_COLLECTION).doc(normalizedEmail);
      return await db.runTransaction(async (t) => {
        const snap = await t.get(docRef);
        if (!snap.exists) return { attempts: 0, maxAttempts: 5 };
        const current = snap.data() as OtpRecord;
        const nextAttempts = (current.attempts || 0) + 1;
        t.update(docRef, { attempts: nextAttempts });
        return { attempts: nextAttempts, maxAttempts: current.maxAttempts || 5 };
      });
    }
  } catch (err) {
    console.warn("[Otp Store] incrementOtpAttempts fallback to memory:", err);
  }

  const record = memoryStore.get(normalizedEmail);
  if (!record) return { attempts: 0, maxAttempts: 5 };
  record.attempts += 1;
  return { attempts: record.attempts, maxAttempts: record.maxAttempts };
}

export async function markOtpAsUsed(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const { db, isAvailable } = getFirebaseAdmin();
    if (isAvailable && db) {
      const docRef = db.collection(OTP_COLLECTION).doc(normalizedEmail);
      await docRef.update({ used: true, usedAt: Date.now() });
      return;
    }
  } catch (err) {
    console.warn("[Otp Store] markOtpAsUsed fallback to memory:", err);
  }

  const record = memoryStore.get(normalizedEmail);
  if (record) {
    record.used = true;
  }
}
