import { getFirebaseAdmin } from "./firebase-admin";

export interface FlowtakeUserSession {
  uid: string;
  email: string;
  customToken?: string;
  isNewUser?: boolean;
}

/**
 * Finds or creates a Firebase user matching the email, and synchronizes with Firestore.
 * Issues a custom Firebase Token so the web client or Flutter app can authenticate with Firebase Auth.
 */
export async function syncUserAndIssueToken(email: string): Promise<FlowtakeUserSession> {
  const normalizedEmail = email.trim().toLowerCase();
  const { auth, db, isAvailable } = getFirebaseAdmin();

  if (!isAvailable || !auth) {
    // If Firebase Admin isn't configured in .env yet, return a mock session identifier
    const mockUid = `usr_${Buffer.from(normalizedEmail).toString("base64url").slice(0, 16)}`;
    return {
      uid: mockUid,
      email: normalizedEmail,
      customToken: `mock_custom_token_dev_${mockUid}`,
      isNewUser: false,
    };
  }

  let userRecord;
  let isNewUser = false;

  try {
    userRecord = await auth.getUserByEmail(normalizedEmail);
  } catch (err: unknown) {
    const errorObj = err as { code?: string };
    if (errorObj.code === "auth/user-not-found") {
      // Create user in Firebase Auth
      userRecord = await auth.createUser({
        email: normalizedEmail,
        emailVerified: true,
        displayName: normalizedEmail.split("@")[0],
      });
      isNewUser = true;
    } else {
      throw err;
    }
  }

  // Ensure emailVerified is true since user just proved ownership via OTP
  if (!userRecord.emailVerified) {
    await auth.updateUser(userRecord.uid, { emailVerified: true });
  }

  // Sync / update user profile in Firestore
  if (db) {
    const userDocRef = db.collection("users").doc(userRecord.uid);
    const existingSnap = await userDocRef.get();

    const timestamp = Date.now();
    if (!existingSnap.exists) {
      await userDocRef.set({
        uid: userRecord.uid,
        email: normalizedEmail,
        createdAt: timestamp,
        lastLoginAt: timestamp,
        authProvider: "flowtake_otp",
      });
    } else {
      await userDocRef.update({
        lastLoginAt: timestamp,
        lastAuthProvider: "flowtake_otp",
      });
    }
  }

  // Issue Firebase custom token
  const customToken = await auth.createCustomToken(userRecord.uid, {
    authMethod: "email_otp",
    source: "flowtake_web",
  });

  return {
    uid: userRecord.uid,
    email: normalizedEmail,
    customToken,
    isNewUser,
  };
}
