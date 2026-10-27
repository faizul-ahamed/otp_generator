import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { env } from "./config";

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

export function getFirebaseAdmin(): {
  app: App | null;
  auth: Auth | null;
  db: Firestore | null;
  isAvailable: boolean;
} {
  if (adminApp && adminAuth && adminDb) {
    return {
      app: adminApp,
      auth: adminAuth,
      db: adminDb,
      isAvailable: true,
    };
  }

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
    return {
      app: adminApp,
      auth: adminAuth,
      db: adminDb,
      isAvailable: true,
    };
  }

  if (env.isFirebaseAdminConfigured()) {
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY,
        }),
      });
      adminAuth = getAuth(adminApp);
      adminDb = getFirestore(adminApp);
      return {
        app: adminApp,
        auth: adminAuth,
        db: adminDb,
        isAvailable: true,
      };
    } catch (error) {
      console.error("[Firebase Admin] Initialization failed:", error);
      return { app: null, auth: null, db: null, isAvailable: false };
    }
  }

  return { app: null, auth: null, db: null, isAvailable: false };
}
