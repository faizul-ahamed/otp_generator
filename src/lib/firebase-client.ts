import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBxYQrkhByJ96rQnlzjpewSne_0uyE3h8E",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "otp-generator-64540.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "otp-generator-64540",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "otp-generator-64540.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "194111856295",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:194111856295:web:251e17612b9af3388ac582",
};

export const isClientFirebaseConfigured = true;

export const app =
  getApps().length > 0
    ? getApp()
    : isClientFirebaseConfigured
    ? initializeApp(firebaseConfig)
    : null;

export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();
