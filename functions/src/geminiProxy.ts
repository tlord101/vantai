/**
 * Gemini Image Generation & Editing Proxy
 * 
 * This module provides secure server-side image generation and editing
 * capabilities using Google's Gemini API with comprehensive safety controls.
 * 
 * Features:
 * - Firebase Authentication (ID token verification)
 * - Per-user rate limiting
 * - Image editing policy enforcement
 * - Face detection and identity preservation checks
 * - Audit logging
 * - Admin override capabilities
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {GoogleGenerativeAI} from "@google/generative-ai";
import vision from "@google-cloud/vision";
import {chargeCredits, CREDIT_COSTS} from "./paystackIntegration";
import {
  logAuditEvent as logAudit,
  AuditEventType,
  logPolicyViolation,
  sanitizePrompt,
} from "./auditLogging";
import {
  enforceRateLimit,
  RATE_LIMITS,
} from "./rateLimiting";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const visionClient = new vision.ImageAnnotatorClient();

// Environment configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Types and Interfaces
 */
interface GenerateImageRequest {
  prompt: string;
  conversationId?: string;
}

interface EditImageRequest {
  prompt: string;
  imageData: string; // base64 encoded image
  conversationId?: string;
  preserveIdentity?: boolean;
}

interface PolicyCheckResult {
  allowed: boolean;
  reason?: string;
  detectedFaces?: number;
  riskLevel: "low" | "medium" | "high";
}

/**
 * Forbidden keywords that indicate identity manipulation attempts
 */
const FORBIDDEN_IDENTITY_KEYWORDS = [
  "replace face",
  "swap face",
  "different person",
  "change identity",
  "impersonate",
  "look like celebrity",
  "look like",
  "become someone else",
  "transform into",
  "face swap",
  "deepfake",
  "public figure",
  "celebrity face",
];

/**
 * Keywords indicating facial structure changes (high risk)
 */
const HIGH_RISK_FACE_KEYWORDS = [
  "reshape face",
  "change face shape",
  "alter facial structure",
  "modify bone structure",
  "change jawline drastically",
  "different nose",
  "different eyes",
  "add facial features",
  "remove facial features",
];

/**
 * Allowed cosmetic edit keywords (low risk)
 */
const ALLOWED_COSMETIC_KEYWORDS = [
  "hair color",
  "hair style",
  "lighting",
  "color grade",
  "background",
  "clothing",
  "makeup",
  "accessories",
  "brightness",
  "contrast",
  "saturation",
];

/**
 * Verify Firebase ID token and extract user info
 */
async function verifyAuth(authHeader: string | undefined): Promise<admin.auth.DecodedIdToken> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Missing or invalid authorization header"
    );
  }

  const idToken = authHeader.split("Bearer ")[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    functions.logger.info("User authenticated", {uid: decodedToken.uid});
    return decodedToken;
  } catch (error) {
    functions.logger.error("Token verification failed", {error});
    throw new functions.https.HttpsError("unauthenticated", "Invalid authentication token");
  }
}

/**
 * Check and enforce rate limits per user
 */
/**
 * Note: Rate limiting is now handled by the enforceRateLimit function
 * from rateLimiting.ts. This function is kept for backward compatibility
 * but delegates to the new system.
 */
async function checkRateLimit(userId: string, isAdmin = false): Promise<void> {
  await enforceRateLimit(userId, RATE_LIMITS.IMAGE_GENERATION, isAdmin);
}

/**
 * Detect faces in image using Google Cloud Vision API
 */
async function detectFaces(imageData: string): Promise<number> {
  try {
    // Remove data URL prefix if present
    const base64Image = imageData.replace(/^data:image\/\w+;base64,/, "");
    
    const [result] = await visionClient.faceDetection({
      image: {content: base64Image},
    });

    const faces = result.faceAnnotations || [];
    functions.logger.info("Face detection completed", {facesDetected: faces.length});
    
    return faces.length;
  } catch (error) {
    functions.logger.error("Face detection failed", {error});
    // Don't block on face detection failure, but log it
    return 0;
  }
}

/**
 * Check if edit prompt violates identity preservation policy
 */
function checkIdentityKeywords(prompt: string): {violation: boolean; reason?: string} {
  const lowerPrompt = prompt.toLowerCase();

  // Check for forbidden identity manipulation
  for (const keyword of FORBIDDEN_IDENTITY_KEYWORDS) {
    if (lowerPrompt.includes(keyword.toLowerCase())) {
      return {
        violation: true,
        reason: `Forbidden identity manipulation detected: "${keyword}". ` +
                "Edits that alter, replace, or impersonate identity are not allowed.",
      };
    }
  }

  // Check for high-risk facial structure changes
  for (const keyword of HIGH_RISK_FACE_KEYWORDS) {
    if (lowerPrompt.includes(keyword.toLowerCase())) {
      return {
        violation: true,
        reason: `High-risk facial structure modification detected: "${keyword}". ` +
                "Edits must preserve facial structure and proportions.",
      };
    }
  }

  return {violation: false};
}

/**
 * Comprehensive policy check for image editing requests
 */
async function performPolicyCheck(
  userId: string,
  prompt: string,
  imageData: string,
  preserveIdentity: boolean = true
): Promise<PolicyCheckResult> {
  functions.logger.info("Starting policy check", {promptLength: prompt.length, preserveIdentity});

  // Step 1: Check for forbidden keywords
  const keywordCheck = checkIdentityKeywords(prompt);
  if (keywordCheck.violation) {
    functions.logger.warn("Policy violation - forbidden keywords", {reason: keywordCheck.reason});
    return {
      allowed: false,
      reason: keywordCheck.reason,
      riskLevel: "high",
    };
  }

  // Step 2: Detect faces in the image
  const facesDetected = await detectFaces(imageData);
  
  // Step 3: If faces detected and preserveIdentity is true, apply stricter rules
  if (facesDetected > 0 && preserveIdentity) {
    const lowerPrompt = prompt.toLowerCase();
    
    // Check if prompt is requesting face-related edits
    const faceEditKeywords = ["face", "facial", "head", "portrait", "person"];
    const isFaceEdit = faceEditKeywords.some((kw) => lowerPrompt.includes(kw));

    if (isFaceEdit) {
      // Ensure it's a cosmetic edit only
      const isCosmeticOnly = ALLOWED_COSMETIC_KEYWORDS.some((kw) => 
        lowerPrompt.includes(kw.toLowerCase())
      );

      if (!isCosmeticOnly) {
        functions.logger.warn("Policy violation - non-cosmetic face edit", {
          facesDetected,
          prompt: prompt.substring(0, 100),
        });
        
        // Log policy violation with sanitized prompt
        await logPolicyViolation(
          userId,
          AuditEventType.POLICY_VIOLATION_FACE_DETECTED,
          `Non-cosmetic edit attempted on image with faces: ${sanitizePrompt(prompt)}`,
          {facesDetected, preserveIdentity}
        );
        
        return {
          allowed: false,
          reason: "Face detected in image. Only cosmetic edits (hair, makeup, lighting, background) " +
                  "are allowed. Edits must preserve facial structure and identity.",
          detectedFaces: facesDetected,
          riskLevel: "medium",
        };
      }
    }

    functions.logger.info("Policy check passed - cosmetic edit allowed", {facesDetected});
    return {
      allowed: true,
      detectedFaces: facesDetected,
      riskLevel: "low",
    };
  }

  // No faces or preserveIdentity=false - allow with logging
  functions.logger.info("Policy check passed", {facesDetected, preserveIdentity});
  return {
    allowed: true,
    detectedFaces: facesDetected,
    riskLevel: facesDetected > 0 ? "medium" : "low",
  };
}

/**
 * Call Gemini API to generate image from text prompt
 */
async function generateImageWithGemini(prompt: string): Promise<string> {
  try {
    functions.logger.info("Calling Gemini API for image generation", {
      promptLength: prompt.length,
    });

    // Using Gemini 3 Pro Image for image generation (20 RPM, 100k TPM)
    const model = genAI.getGenerativeModel({model: "gemini-3-pro-image"});
    
    const result = await model.generateContent([
      {
        text: `Generate a high-quality image based on this description: ${prompt}`,
      },
    ]);

    const response = await result.response;
    const imageData = response.text();

    functions.logger.info("Gemini API call successful");
    return imageData;
  } catch (error) {
    functions.logger.error("Gemini API call failed", {error});
    throw new functions.https.HttpsError(
      "internal",
      "Failed to generate image with Gemini API"
    );
  }
}

/**
 * Call Gemini API to edit an existing image
 */
async function editImageWithGemini(prompt: string, imageData: string): Promise<string> {
  try {
    functions.logger.info("Calling Gemini API for image editing", {
      promptLength: prompt.length,
    });

    // Remove data URL prefix if present
    const base64Image = imageData.replace(/^data:image\/\w+;base64,/, "");

    const model = genAI.getGenerativeModel({model: "gemini-3-pro-image"});
    
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image,
        },
      },
      {
        text: `Edit this image according to the following instructions, preserving the original ` +
              `subject's identity and facial structure: ${prompt}`,
      },
    ]);

    const response = await result.response;
    const editedImageData = response.text();

    functions.logger.info("Gemini API edit successful");
    return editedImageData;
  } catch (error) {
    functions.logger.error("Gemini API edit failed", {error});
    throw new functions.https.HttpsError(
      "internal",
      "Failed to edit image with Gemini API"
    );
  }
}

/**
 * Persist image reference to Firestore conversation
 */
async function persistImageToConversation(
  conversationId: string,
  imageUrl: string,
  userId: string,
  prompt: string,
  isEdit: boolean
): Promise<void> {
  try {
    const messageRef = db.collection("conversations").doc(conversationId).collection("messages").doc();
    
    await messageRef.set({
      userId,
      prompt,
      imageUrl,
      type: isEdit ? "image-edit" : "image-generation",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString(),
    });

    functions.logger.info("Image persisted to conversation", {conversationId, messageId: messageRef.id});
  } catch (error) {
    functions.logger.error("Failed to persist image", {error, conversationId});
    // Don't throw - this is non-critical
  }
}

/**
 * Log audit event for security tracking
 */
/**
 * Deprecated: Use logAudit from auditLogging.ts instead
 * Kept for backward compatibility
 */
async function logAuditEvent(
  userId: string,
  action: string,
  details: Record<string, unknown>
): Promise<void> {
  // Delegate to new audit system
  await logAudit(
    AuditEventType.IMAGE_GENERATION_REQUEST,
    userId,
    action,
    details
  );
}

/**
 * POST /v1/generate-image
 * Generate a new image from text prompt
 */
export const generateImage = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    // Authenticate user
    const decodedToken = await verifyAuth(req.headers.authorization);
    const userId = decodedToken.uid;

    // Check rate limit
    await checkRateLimit(userId);

    // Validate request body
    const {prompt, conversationId} = req.body as GenerateImageRequest;
    
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      throw new functions.https.HttpsError("invalid-argument", "Valid prompt is required");
    }

    if (prompt.length > 2000) {
      throw new functions.https.HttpsError("invalid-argument", "Prompt too long (max 2000 characters)");
    }

    functions.logger.info("Image generation request", {userId, promptLength: prompt.length});

    // Check if user is admin (free for admins)
    const userRecord = await admin.auth().getUser(userId);
    const isAdmin = userRecord.customClaims?.admin === true;

    // Charge credits (unless admin)
    if (!isAdmin) {
      const hasCredits = await chargeCredits(
        userId,
        CREDIT_COSTS.IMAGE_GENERATION,
        {
          action: "image-generation",
          prompt: prompt.substring(0, 200),
          conversationId,
        }
      );

      if (!hasCredits) {
        functions.logger.warn("Insufficient credits for image generation", {userId});
        res.status(402).json({
          error: "Insufficient credits",
          code: "insufficient-credits",
          required: CREDIT_COSTS.IMAGE_GENERATION,
          message: "You don't have enough credits to generate an image.",
          action: {
            text: "Buy Credits",
            url: "/billing",
          },
        });
        return;
      }
    }

    // Log audit event
    await logAuditEvent(userId, "image-generation-request", {
      prompt: prompt.substring(0, 200),
      conversationId,
      creditsCharged: isAdmin ? 0 : CREDIT_COSTS.IMAGE_GENERATION,
    });

    // Generate image with Gemini
    const imageData = await generateImageWithGemini(prompt);

    // Persist to conversation if provided
    if (conversationId) {
      await persistImageToConversation(conversationId, imageData, userId, prompt, false);
    }

    // Log success
    await logAuditEvent(userId, "image-generation-success", {conversationId});

    res.status(200).json({
      success: true,
      imageData,
      conversationId,
    });
  } catch (error) {
    functions.logger.error("Image generation failed", {error});
    
    if (error instanceof functions.https.HttpsError) {
      res.status(403).json({
        error: error.message,
        code: error.code,
      });
    } else {
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
});

/**
 * POST /v1/edit-image
 * Edit an existing image with safety controls
 */
export const editImage = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    // Authenticate user
    const decodedToken = await verifyAuth(req.headers.authorization);
    const userId = decodedToken.uid;

    // Check rate limit
    await checkRateLimit(userId);

    // Validate request body
    const {prompt, imageData, conversationId, preserveIdentity = true} = 
      req.body as EditImageRequest;
    
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      throw new functions.https.HttpsError("invalid-argument", "Valid prompt is required");
    }

    if (!imageData || typeof imageData !== "string") {
      throw new functions.https.HttpsError("invalid-argument", "Valid image data is required");
    }

    if (prompt.length > 2000) {
      throw new functions.https.HttpsError("invalid-argument", "Prompt too long (max 2000 characters)");
    }

    functions.logger.info("Image edit request", {
      userId,
      promptLength: prompt.length,
      preserveIdentity,
    });

    // Check if user is admin (free for admins)
    const userRecord = await admin.auth().getUser(userId);
    const isAdmin = userRecord.customClaims?.admin === true;

    // Charge credits (unless admin)
    if (!isAdmin) {
      const hasCredits = await chargeCredits(
        userId,
        CREDIT_COSTS.IMAGE_EDIT,
        {
          action: "image-edit",
          prompt: prompt.substring(0, 200),
          conversationId,
          preserveIdentity,
        }
      );

      if (!hasCredits) {
        functions.logger.warn("Insufficient credits for image edit", {userId});
        res.status(402).json({
          error: "Insufficient credits",
          code: "insufficient-credits",
          required: CREDIT_COSTS.IMAGE_EDIT,
          message: "You don't have enough credits to edit this image.",
          action: {
            text: "Buy Credits",
            url: "/billing",
          },
        });
        return;
      }
    }

    // Log audit event
    await logAuditEvent(userId, "image-edit-request", {
      prompt: prompt.substring(0, 200),
      conversationId,
      preserveIdentity,
      creditsCharged: isAdmin ? 0 : CREDIT_COSTS.IMAGE_EDIT,
    });

    // CRITICAL: Perform policy check
    const policyResult = await performPolicyCheck(userId, prompt, imageData, preserveIdentity);

    if (!policyResult.allowed) {
      functions.logger.warn("Policy check failed", {
        userId,
        reason: policyResult.reason,
        riskLevel: policyResult.riskLevel,
      });

      // Log policy violation
      await logAuditEvent(userId, "image-edit-policy-violation", {
        prompt: prompt.substring(0, 200),
        reason: policyResult.reason,
        riskLevel: policyResult.riskLevel,
        facesDetected: policyResult.detectedFaces,
      });

      res.status(403).json({
        success: false,
        error: policyResult.reason,
        code: "policy-violation",
        riskLevel: policyResult.riskLevel,
      });
      return;
    }

    // Policy passed - proceed with edit
    functions.logger.info("Policy check passed, proceeding with edit", {
      userId,
      riskLevel: policyResult.riskLevel,
      facesDetected: policyResult.detectedFaces,
    });

    // Edit image with Gemini
    const editedImageData = await editImageWithGemini(prompt, imageData);

    // Persist to conversation if provided
    if (conversationId) {
      await persistImageToConversation(conversationId, editedImageData, userId, prompt, true);
    }

    // Log success
    await logAuditEvent(userId, "image-edit-success", {
      conversationId,
      riskLevel: policyResult.riskLevel,
      facesDetected: policyResult.detectedFaces,
    });

    res.status(200).json({
      success: true,
      imageData: editedImageData,
      conversationId,
      policyCheck: {
        riskLevel: policyResult.riskLevel,
        facesDetected: policyResult.detectedFaces,
      },
    });
  } catch (error) {
    functions.logger.error("Image edit failed", {error});
    
    if (error instanceof functions.https.HttpsError) {
      res.status(403).json({
        error: error.message,
        code: error.code,
      });
    } else {
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
});

/**
 * POST /v1/approve-edit
 * Admin-only endpoint to manually approve a flagged edit request
 */
export const approveEdit = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    // Authenticate user
    const decodedToken = await verifyAuth(req.headers.authorization);
    const userId = decodedToken.uid;

    // Check if user is admin
    const userRecord = await admin.auth().getUser(userId);
    const isAdmin = userRecord.customClaims?.admin === true;

    if (!isAdmin) {
      functions.logger.warn("Unauthorized admin access attempt", {userId});
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only administrators can approve edit requests"
      );
    }

    // Validate request
    const {requestId, prompt, imageData, reason} = req.body;

    if (!requestId || !prompt || !imageData) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "requestId, prompt, and imageData are required"
      );
    }

    functions.logger.info("Admin approval request", {
      adminId: userId,
      requestId,
      reason,
    });

    // Log admin override
    await logAuditEvent(userId, "admin-edit-approval", {
      requestId,
      prompt: prompt.substring(0, 200),
      reason,
      timestamp: new Date().toISOString(),
    });

    // Bypass policy check and edit image directly
    const editedImageData = await editImageWithGemini(prompt, imageData);

    // Store approval record
    await db.collection("adminApprovals").add({
      adminId: userId,
      requestId,
      prompt: prompt.substring(0, 500),
      reason,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString(),
    });

    functions.logger.info("Admin approval completed", {adminId: userId, requestId});

    res.status(200).json({
      success: true,
      imageData: editedImageData,
      approvedBy: userId,
      approvedAt: new Date().toISOString(),
    });
  } catch (error) {
    functions.logger.error("Admin approval failed", {error});
    
    if (error instanceof functions.https.HttpsError) {
      res.status(403).json({
        error: error.message,
        code: error.code,
      });
    } else {
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
});
