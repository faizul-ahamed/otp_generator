# Flowtake Secure Email OTP Authentication Website

A modern, production-grade passwordless email OTP authentication web application built for the **Flowtake** ecosystem. Seamlessly connects to your existing **Firebase** project and shares user identities with the **Flowtake Flutter application**.

---

## 🚀 Key Features

- **Modern SaaS Aesthetics**: Minimalist, glassmorphism design with responsive desktop/mobile layouts, subtle kinetic animations, and fluid dark & light theme modes.
- **Cryptographically Secure OTP**:
  - Generated using Node.js CSPRNG (`crypto.randomInt`) with uniform distribution (no modulo bias).
  - Stored strictly as HMAC-SHA256 salted hashes—raw OTPs are **never stored** in plaintext.
  - Constant-time verification (`crypto.timingSafeEqual`) to eliminate timing side-channel attacks.
- **Abuse Prevention & Rate Limiting**:
  - 5-minute single-use OTP expiration.
  - Automatic invalidation of previous OTPs upon resend request.
  - 60-second cooldown period between code requests.
  - Brute-force protection: Maximum 5 verification attempts per code.
  - Multi-tier IP and email rate limiting (10 requests / 15 mins per IP, 5 requests / 15 mins per email).
- **Firebase & Flutter Ecosystem Integration**:
  - Server-side Firebase Admin SDK verifies identity and mints custom Firebase Auth tokens.
  - Creates and updates user profiles in Cloud Firestore (`users/{uid}`).
  - Both web and Flutter mobile apps share identical user accounts, UIDs, and Firestore documents.
  - Optional Google Sign-In alternative.
- **Transactional Email Delivery**:
  - Integrated with **Resend** using responsive, branded HTML templates.
  - Built-in Developer Preview mode for instant local testing when credentials are not yet supplied.

---

## 📂 Project Architecture

```
├── src/
│   ├── app/
│   │   ├── api/auth/
│   │   │   ├── request-otp/route.ts  # Secure code generation, rate limit & email dispatch
│   │   │   ├── verify-otp/route.ts   # Timing-safe verify, attempt decrement & Firebase custom token
│   │   │   └── signout/route.ts      # Session termination & cookie revocation
│   │   ├── globals.css               # Tailwind CSS styles & modern glassmorphic tokens
│   │   ├── layout.tsx                # App layout, Inter & JetBrains Mono typography, SEO tags
│   │   └── page.tsx                  # Landing & authentication interface
│   ├── components/
│   │   ├── AuthCard.tsx              # Interactive authentication state machine
│   │   ├── FlowtakeLogo.tsx          # Brand identity SVG mark & typography
│   │   ├── OtpInput.tsx              # 6-box OTP input with auto-focus, paste, & auto-submit
│   │   └── ThemeToggle.tsx           # Dark/Light mode toggle switch
│   └── lib/
│       ├── config.ts                 # Validated environment configuration
│       ├── crypto-otp.ts             # CSPRNG OTP generation & timing-safe HMAC hashing
│       ├── firebase-admin.ts         # Server-side Firebase Admin SDK initialization
│       ├── firebase-client.ts        # Client-side Firebase SDK (for custom token & Google sign-in)
│       ├── mailer.ts                 # Resend transactional email service
│       ├── otp-store.ts              # Firestore atomic transaction store & fallback repository
│       └── user-service.ts           # User sync & Firebase custom token generation
├── .env.example                      # Complete environment configuration template
└── package.json                      # Next.js 16, React 19, Firebase Admin, Resend, Vitest
```

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- **Node.js** v20+ or v22+
- **npm** or **pnpm**

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/flowtake-auth.git
cd flowtake-auth

# Install dependencies
npm install --legacy-peer-deps
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> **💡 Dev Mode Tip:** If you run the project without setting `RESEND_API_KEY`, the application automatically enters **Dev Preview Mode**, printing the generated OTP to the browser card and terminal so you can test the full verification flow immediately!

---

## 🧪 Automated Testing

Execute the test suite with Vitest:
```bash
npm test
```
This tests:
- Cryptographic OTP generation (6 digits, uniform distribution).
- HMAC-SHA256 hashing and case-insensitive email normalization.
- Timing-safe comparison.
- Expiration and attempt limit counters.
- Single-use replay protection.
- IP and email rate limiting.

---

## 🔒 Configuration Guides

### 1. Firebase Configuration (Sharing with Flutter App)

To link this web authentication with your existing Flutter Firebase project:

1. Open the [Firebase Console](https://console.firebase.google.com/) and select your **Flowtake** project.
2. Go to **Project Settings** > **Service Accounts**:
   - Click **Generate new private key** and download the JSON file.
   - Set the following in `.env.local` (or Vercel Environment Variables):
     - `FIREBASE_PROJECT_ID`: `"your-project-id"`
     - `FIREBASE_CLIENT_EMAIL`: `"firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"`
     - `FIREBASE_PRIVATE_KEY`: Private key string (ensure newlines are formatted as `\n`).
3. Go to **Project Settings** > **General** > **Your apps**:
   - Add a **Web App** (or select your existing one).
   - Copy the `firebaseConfig` keys into `NEXT_PUBLIC_FIREBASE_*`.
4. Go to **Authentication** > **Settings** > **Authorized domains**:
   - Add `localhost` (for local dev).
   - Add your Vercel domain (e.g. `flowtake-auth.vercel.app` or custom domain).

### 2. Resend Email Configuration

1. Create a free account at [Resend.com](https://resend.com).
2. Generate an API Key under **API Keys** and set `RESEND_API_KEY=re_...` in `.env.local`.
3. In **Domains**, add your domain (e.g. `flowtake.com`) and add the DNS records (DKIM, SPF) provided by Resend.
4. Update `EMAIL_FROM="Flowtake <auth@yourdomain.com>"` in production.

---

## 🌐 GitHub & Vercel Deployment Instructions

### Step 1: Initialize and Push to GitHub

Run these commands in your project directory:

```bash
# Initialize git if not already done
git init
git add .
git commit -m "feat: initial Flowtake secure OTP authentication system"

# Add your GitHub repository remote
git branch -M main
git remote add origin https://github.com/<your-github-username>/flowtake-auth.git

# Push code to GitHub
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Select your GitHub repository `flowtake-auth` and click **Import**.
4. In the **Environment Variables** section, add the variables from `.env.example`:
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `OTP_SECRET`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel URL, e.g., `https://flowtake-auth.vercel.app`)
5. Click **Deploy**. Vercel will build and launch your production application.

---

## 📱 Flutter Application Integration

In your Flutter app, when a user signs in via this website (or if you invoke this authentication service), authenticate using the issued custom token:

```dart
import 'package:firebase_auth/firebase_auth.dart';

// Sign in with the custom token returned by the Flowtake Auth API:
UserCredential userCredential = await FirebaseAuth.instance.signInWithCustomToken(customToken);

print("Signed in user UID: ${userCredential.user?.uid}");
```

Both your Next.js website and Flutter mobile app will now share the exact same user identity and Firestore database records.
