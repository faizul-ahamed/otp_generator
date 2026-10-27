// Environment variable helper with safe defaults & clear warnings

export const env = {
  // Resend (configured via Vercel Environment Variables or .env.local)
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "Flowtake Auth <onboarding@resend.dev>",

  // Firebase Admin (Server-side)
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "otp-generator-64540",
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || "",
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : "",

  // App URLs & Security
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://otp-generator-bice.vercel.app",
  OTP_SECRET: process.env.OTP_SECRET || "flowtake_secret_a9b8c7d6e5f4g3h2i1j0k9l8m7n6o5p4",

  // Demo / Dev Mode fallback (if Resend or Firestore is not yet configured by user)
  isResendConfigured: () => Boolean(env.RESEND_API_KEY && env.RESEND_API_KEY.startsWith("re_")),
  isFirebaseAdminConfigured: () =>
    Boolean(
      (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ),
};
