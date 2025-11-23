/**
 * Constants and Configuration
 */

// Rate Limiting
export const RATE_LIMIT_WINDOW_MS = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS || "3600000"
); // 1 hour
export const RATE_LIMIT_MAX_REQUESTS = parseInt(
  process.env.RATE_LIMIT_MAX_REQUESTS || "20"
);

// API Configuration
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
export const GEMINI_ENDPOINT = 
  process.env.GEMINI_ENDPOINT || "https://generativelanguage.googleapis.com";

// Prompt Limits
export const MAX_PROMPT_LENGTH = 2000;
export const MAX_IMAGE_SIZE_MB = 10;

// Policy Keywords
export const FORBIDDEN_IDENTITY_KEYWORDS = [
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

export const HIGH_RISK_FACE_KEYWORDS = [
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

export const ALLOWED_COSMETIC_KEYWORDS = [
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

// Firestore Collections
export const COLLECTIONS = {
  RATE_LIMITS: "rateLimits",
  AUDIT_LOGS: "auditLogs",
  ADMIN_APPROVALS: "adminApprovals",
  CONVERSATIONS: "conversations",
  MESSAGES: "messages",
};

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHENTICATED: "Missing or invalid authorization header",
  INVALID_TOKEN: "Invalid authentication token",
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded. Try again later.",
  INVALID_PROMPT: "Valid prompt is required",
  PROMPT_TOO_LONG: `Prompt too long (max ${MAX_PROMPT_LENGTH} characters)`,
  INVALID_IMAGE_DATA: "Valid image data is required",
  POLICY_VIOLATION: "Request violates image editing policy",
  ADMIN_ONLY: "Only administrators can access this endpoint",
  GEMINI_API_ERROR: "Failed to process image with Gemini API",
  INTERNAL_ERROR: "Internal server error",
};
