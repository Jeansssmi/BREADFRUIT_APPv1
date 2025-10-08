import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { setGlobalOptions } from "firebase-functions/v2/options";

admin.initializeApp();
setGlobalOptions({ region: "us-central1" });

// --- Interfaces ---
interface NewUserRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  image?: string;
  status: string;
  joined: string;
}

interface NewTreeRequest {
  city: string;
  barangay: string;
  diameter: number;
  dateTracked: string;
  fruitStatus: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  image?: string;
  status: string;
  trackedBy: string;
}

// ==============================
// 🚀 CREATE NEW USER (Callable)
// ==============================
export const createNewUser = onCall(async (request) => {
  logger.info("📌 createNewUser called", { request });

  try {
    if (!request || !request.data) {
      logger.error("⚠️ Missing request data", { request });
      throw new HttpsError("invalid-argument", "Request body is missing data.");
    }

    const data = request.data as NewUserRequest;
    const db = admin.firestore();

    logger.info("📥 Received data:", data);

    // Validate request data
    if (!data.email || !data.password || !data.name) {
      logger.error("⚠️ Missing required fields:", data);
      throw new HttpsError("invalid-argument", "All fields are required.");
    }
    logger.info("✅ Request validation passed");

    // Check if user already exists
    logger.info("🔍 Checking if user exists:", data.email);
    const existingUser = await admin.auth().getUserByEmail(data.email).catch(() => null);
    if (existingUser) {
      logger.error("⚠️ Email already exists:", data.email);
      throw new HttpsError("already-exists", "This email is already registered.");
    }

    // Create new user in Firebase Auth
    logger.info("⚙️ Creating user in Firebase Auth...");
    const userRecord = await admin.auth().createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
    });
    logger.info("✅ User created in Firebase Auth:", userRecord.uid);

    // Assign custom claims
    logger.info("🔧 Setting custom claims for user...");
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: data.role });
    logger.info("✅ Custom claims set");

    // Save user to Firestore
    logger.info("💾 Saving user to Firestore...");
    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.status,
      image: data.image || null,
      joined: new Date().toISOString(),
    });
    logger.info("✅ User saved to Firestore:", userRecord.uid);

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    logger.error("🔥 Error in createNewUser:", error);

    // Preserve existing HttpsError
    if (error instanceof HttpsError) {
      throw error;
    }

    // Map known Firebase Auth errors
    if (error.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "Email already exists.");
    }
    if (error.code === "auth/invalid-email") {
      throw new HttpsError("invalid-argument", "Invalid email format.");
    }
    if (error.code === "auth/weak-password") {
      throw new HttpsError("invalid-argument", "Password is too weak.");
    }

    // Unknown error
    throw new HttpsError("internal", error.message || "Internal server error.");
  }
});

// ==============================
// 🗑️ DELETE USER (Callable)
// ==============================
export const deleteUser = onCall(async (request) => {
  logger.info("📌 deleteUser called", { request });

  try {
    if (!request || !request.data) {
      logger.error("⚠️ Missing request data", { request });
      throw new HttpsError("invalid-argument", "Request body is missing data.");
    }

    const { uid } = request.data;
    if (!uid) {
      logger.error("⚠️ UID is required", { request });
      throw new HttpsError("invalid-argument", "UID is required.");
    }

    const db = admin.firestore();

    logger.info("🗑️ Deleting user from Firestore and Auth:", uid);
    await db.collection("users").doc(uid).delete();
    await admin.auth().deleteUser(uid);

    logger.info("✅ Deleted user:", uid);
    return { success: true };
  } catch (error: any) {
    logger.error("🔥 Error deleting user:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", error.message || "Failed to delete user.");
  }
});

// ==============================
// 🌳 ADD NEW TREE (Callable)
// ==============================
export const addNewTree = onCall(async (request) => {
  logger.info("📌 addNewTree called", { request });

  try {
    if (!request || !request.data) {
      logger.error("⚠️ Missing request data", { request });
      throw new HttpsError("invalid-argument", "Request body is missing data.");
    }

    const data = request.data as NewTreeRequest;
    const db = admin.firestore();

    logger.info("🌳 addNewTree received:", data);

    const year = new Date().getFullYear();
    const prefix = `BFT-${year}`;
    const treeCollection = db.collection("trees");

    logger.info("🔍 Finding latest treeID for prefix:", prefix);
    const querySnapshot = await treeCollection
      .where("treeID", ">=", prefix)
      .where("treeID", "<=", `${prefix}-999999`)
      .orderBy("treeID", "desc")
      .limit(1)
      .get();

    let newSequence = 1;
    if (!querySnapshot.empty) {
      const lastTreeID = querySnapshot.docs[0].data().treeID;
      const lastSeq = parseInt(lastTreeID.split("-")[2], 10);
      newSequence = lastSeq + 1;
    }

    if (newSequence > 999999) {
      logger.error("⚠️ Maximum ID limit reached for this year");
      throw new HttpsError("resource-exhausted", "Maximum ID limit reached for this year.");
    }

    const treeID = `${prefix}-${newSequence.toString().padStart(6, "0")}`;
    const treeData = { treeID, ...data };

    logger.info("💾 Saving tree to Firestore:", treeID);
    await treeCollection.doc(treeID).set(treeData);
    logger.info("✅ Tree added:", treeID);

    return { success: true, treeID };
  } catch (error: any) {
    logger.error("🔥 Error adding tree:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", error.message || "Internal server error.");
  }
});
