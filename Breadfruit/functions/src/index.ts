import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { setGlobalOptions } from "firebase-functions/v2/options";

// Initialize Firebase services
admin.initializeApp();
setGlobalOptions({ region: "us-central1" });

// --- Interfaces for data validation ---
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
  // Validate that request data exists before using it
  if (!request || !request.data) {
    logger.error("⚠️ Missing request data!", { request });
    throw new HttpsError("invalid-argument", "Request body is missing data.");
  }
  
  try {
    const data = request.data as NewUserRequest;
    const db = admin.firestore();

    logger.info("📥 createNewUser received:", data);

    // Validate that required fields were sent
    if (!data.email || !data.password || !data.name) {
      throw new HttpsError("invalid-argument", "All fields are required.");
    }

    // Security Check: See if user already exists
    const existingUser = await admin.auth().getUserByEmail(data.email).catch(() => null);
    if (existingUser) {
      throw new HttpsError("already-exists", "This email is already registered.");
    }

    // Create the user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
    });

    // Assign a custom role to the user
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: data.role });

    // Save the user's profile to the Firestore database
    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.status,
      image: data.image || null, // Use provided image or default to null
      joined: new Date().toISOString(), // Use the server's timestamp for consistency
    });

 // ✅ **FIX: Generate and trigger the verification email**
    const link = await admin.auth().generateEmailVerificationLink(data.email);
    await db.collection("mail").add({
      to: [data.email],
      message: {
        subject: "Verify your email for Breadfruit Tracker",
        html: `
          <p>Hello ${data.name},</p>
          <p>Please verify your email address by clicking the link below:</p>
          <p><a href="${link}">Verify Email</a></p>
          <p>Thanks,</p>
          <p>The Breadfruit Tracker Team</p>
        `,
      },
    });



    logger.info("✅ User created:", userRecord.uid);
    return { success: true, uid: userRecord.uid };

  } catch (error: any) {
    logger.error("🔥 Error creating user:", error);

    // If it's an error we already defined, just pass it along
    if (error instanceof HttpsError) {
      throw error;
    }

    // Map specific internal Firebase errors to user-friendly ones
    if (error.code === "auth/invalid-email") {
      throw new HttpsError("invalid-argument", "Invalid email format.");
    }
    if (error.code === "auth/weak-password") {
      throw new HttpsError("invalid-argument", "Password is too weak.");
    }

    // For any other unexpected errors, throw a generic internal error
    throw new HttpsError("internal", error.message || "Internal server error.");
  }
});

// ==============================
// 🗑️ DELETE USER (Callable)
// ==============================
export const deleteUser = onCall(async (request) => {
  // Validate that request data exists
  if (!request || !request.data) {
    logger.error("⚠️ Missing request data!", { request });
    throw new HttpsError("invalid-argument", "Request body is missing data.");
  }
  
  try {
    const { uid } = request.data;
    if (!uid) throw new HttpsError("invalid-argument", "UID is required.");

    const db = admin.firestore();

    // Delete from both Firestore and Authentication
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
  // Validate that request data exists
  if (!request || !request.data) {
    logger.error("⚠️ Missing request data!", { request });
    throw new HttpsError("invalid-argument", "Request body is missing data.");
  }
  
  try {
    const data = request.data as NewTreeRequest;
    const db = admin.firestore();

    logger.info("🌳 addNewTree received:", data);

    const year = new Date().getFullYear();
    const prefix = `BFT-${year}`;
    const treeCollection = db.collection("trees");

    // Find the latest treeID to generate the next sequential ID
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
      throw new HttpsError("resource-exhausted", "Maximum ID limit reached for this year.");
    }

    const treeID = `${prefix}-${newSequence.toString().padStart(6, "0")}`;
    const treeData = { treeID, ...data };

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