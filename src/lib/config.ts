// Environment variable helper with safe defaults & clear warnings

export const env = {
  // Resend
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "Flowtake Auth <onboarding@resend.dev>",

  // Firebase Admin (Server-side)
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || "",
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : "",

  // App URLs & Security
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  OTP_SECRET: process.env.OTP_SECRET || "flowtake-super-secret-salt-change-in-production-123456",

  // Demo / Dev Mode fallback (if Resend or Firestore is not yet configured by user)
  isResendConfigured: () => Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith("re_")),
  isFirebaseAdminConfigured: () =>
    Boolean(
      (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ),
};
