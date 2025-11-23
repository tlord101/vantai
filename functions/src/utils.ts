/**
 * Utility Functions for Gemini Proxy
 */

import * as functions from "firebase-functions";

/**
 * Parse base64 image data and extract MIME type
 */
export function parseImageData(imageData: string): {
  base64: string;
  mimeType: string;
} {
  const dataUrlPattern = /^data:(image\/\w+);base64,(.+)$/;
  const match = imageData.match(dataUrlPattern);

  if (match) {
    return {
      mimeType: match[1],
      base64: match[2],
    };
  }

  // Assume JPEG if no data URL prefix
  return {
    mimeType: "image/jpeg",
    base64: imageData,
  };
}

/**
 * Validate image size (base64 string length approximation)
 */
export function validateImageSize(imageData: string, maxSizeMB: number = 10): boolean {
  const sizeInBytes = (imageData.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  if (sizeInMB > maxSizeMB) {
    functions.logger.warn("Image size exceeds limit", {
      sizeInMB: sizeInMB.toFixed(2),
      maxSizeMB,
    });
    return false;
  }
  
  return true;
}

/**
 * Sanitize prompt for logging (truncate and remove sensitive data)
 */
export function sanitizePromptForLogging(prompt: string, maxLength: number = 200): string {
  if (prompt.length <= maxLength) {
    return prompt;
  }
  return prompt.substring(0, maxLength) + "...";
}

/**
 * Calculate rate limit reset time
 */
export function getRateLimitResetTime(windowStart: number, windowMs: number): Date {
  return new Date(windowStart + windowMs);
}

/**
 * Format error response
 */
export function formatErrorResponse(error: unknown): {
  error: string;
  code?: string;
} {
  if (error instanceof functions.https.HttpsError) {
    return {
      error: error.message,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
    };
  }

  return {
    error: "An unknown error occurred",
  };
}

/**
 * Validate Firebase ID token format
 */
export function isValidTokenFormat(authHeader: string | undefined): boolean {
  if (!authHeader) {
    return false;
  }

  if (!authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.split("Bearer ")[1];
  return Boolean(token && token.length > 0);
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(customClaims: {[key: string]: unknown} | undefined): boolean {
  return customClaims?.admin === true;
}

/**
 * Generate unique request ID for tracking
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Extract keywords from prompt for analysis
 */
export function extractKeywords(prompt: string): string[] {
  const words = prompt.toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3);
  
  return [...new Set(words)];
}

/**
 * Check if prompt contains any of the given keywords
 */
export function containsAnyKeyword(prompt: string, keywords: string[]): boolean {
  const lowerPrompt = prompt.toLowerCase();
  return keywords.some((keyword) => lowerPrompt.includes(keyword.toLowerCase()));
}

/**
 * Calculate confidence score for cosmetic edit detection
 */
export function calculateCosmeticConfidence(
  prompt: string,
  allowedKeywords: string[]
): number {
  const matches = allowedKeywords.filter((keyword) =>
    prompt.toLowerCase().includes(keyword.toLowerCase())
  );
  
  return matches.length / Math.max(allowedKeywords.length, 1);
}
