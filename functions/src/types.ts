/**
 * Type Definitions for Gemini Proxy Module
 */

export interface GenerateImageRequest {
  prompt: string;
  conversationId?: string;
}

export interface EditImageRequest {
  prompt: string;
  imageData: string;
  conversationId?: string;
  preserveIdentity?: boolean;
}

export interface PolicyCheckResult {
  allowed: boolean;
  reason?: string;
  detectedFaces?: number;
  riskLevel: "low" | "medium" | "high";
}

export interface RateLimitRecord {
  userId: string;
  requests: number;
  windowStart: number;
}

export interface AuditLogEntry {
  userId: string;
  action: string;
  details: Record<string, unknown>;
  timestamp: FirebaseFirestore.Timestamp;
  createdAt: string;
}

export interface AdminApprovalRecord {
  adminId: string;
  requestId: string;
  prompt: string;
  reason: string;
  timestamp: FirebaseFirestore.Timestamp;
  createdAt: string;
}

export interface ImageMessage {
  userId: string;
  prompt: string;
  imageUrl: string;
  type: "image-edit" | "image-generation";
  timestamp: FirebaseFirestore.Timestamp;
  createdAt: string;
}

export interface GeminiApiResponse {
  success: boolean;
  imageData?: string;
  conversationId?: string;
  error?: string;
  code?: string;
  policyCheck?: {
    riskLevel: "low" | "medium" | "high";
    facesDetected?: number;
  };
}

export interface ApproveEditRequest {
  requestId: string;
  prompt: string;
  imageData: string;
  reason: string;
}
