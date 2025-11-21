import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { setGlobalOptions } from "firebase-functions/v2/options";
import { defineSecret } from "firebase-functions/params";
import * as nodemailer from "nodemailer";


// Initialize Firebase services
admin.initializeApp();
setGlobalOptions({ region: "us-central1" });

const GMAIL_USER = defineSecret("GMAIL_USER");
const GMAIL_PASS = defineSecret("GMAIL_PASS");

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

interface EmailOtp {
  otp: string;
  expiry: number;
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


// ==============================
// 📧 SEND EMAIL OTP
// ==============================
export const sendEmailOtp = onCall(
  { secrets: [GMAIL_USER, GMAIL_PASS] },
  async (request) => {
    const { email } = request.data || {};
    const db = admin.firestore();

    if (!email) throw new HttpsError("invalid-argument", "Email is required.");

    // Prevent rapid OTP requests
    const existing = await db.collection("emailOtps").doc(email).get();
    if (existing.exists) {
      const { expiry } = existing.data() as EmailOtp;
      if (Date.now() < expiry - 4 * 60 * 1000) {
        throw new HttpsError("resource-exhausted", "Wait 1 minute before requesting again.");
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000;

    await db.collection("emailOtps").doc(email).set({ otp, expiry });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: GMAIL_USER.value(),
        pass: GMAIL_PASS.value(),
      },
    });

    const mailOptions = {
      from: `"Breadfruit Tracker" <${GMAIL_USER.value()}>`,
      to: email,
      subject: "Your Breadfruit Tracker Verification Code",
      html: `
        <p>Hello,</p>
        <p>Your verification code is: <b>${otp}</b></p>
        <p>This code expires in 5 minutes.</p>
        <p>Thank you,<br/>Breadfruit Tracker Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`✅ OTP sent to ${email}`);
    return { success: true, message: "OTP sent successfully." };
  }
);

// ==============================
// ✅ VERIFY EMAIL OTP
// ==============================
export const verifyEmailOtp = onCall(async (request) => {
  const { email, otp } = request.data || {};
  const db = admin.firestore();

  if (!email || !otp) {
    throw new HttpsError("invalid-argument", "Email and OTP required.");
  }

  const doc = await db.collection("emailOtps").doc(email).get();

  if (!doc.exists) throw new HttpsError("not-found", "No OTP found.");
  const { otp: storedOtp, expiry } = doc.data() as EmailOtp;

  if (Date.now() > expiry) {
    await db.collection("emailOtps").doc(email).delete();
    throw new HttpsError("deadline-exceeded", "OTP expired.");
  }

  if (otp !== storedOtp) {
    throw new HttpsError("permission-denied", "Invalid OTP.");
  }

  await db.collection("emailOtps").doc(email).delete();
  logger.info(`✅ OTP verified for ${email}`);
  return { success: true, message: "OTP verified successfully." };
});