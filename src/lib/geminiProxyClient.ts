/**
 * Client-side helper for calling Gemini Proxy endpoints
 * 
 * Usage in your React/TypeScript app:
 * 
 * import { GeminiProxyClient } from './lib/geminiProxyClient';
 * 
 * const client = new GeminiProxyClient(auth);
 * const result = await client.generateImage("A beautiful sunset");
 */

import {getAuth} from "firebase/auth";

export interface GeminiProxyConfig {
  baseUrl?: string;
}

export interface GenerateImageOptions {
  prompt: string;
  conversationId?: string;
}

export interface EditImageOptions {
  prompt: string;
  imageData: string;
  conversationId?: string;
  preserveIdentity?: boolean;
}

export interface GeminiProxyResponse {
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

export interface AdminApprovalOptions {
  requestId: string;
  prompt: string;
  imageData: string;
  reason: string;
}

export class GeminiProxyClient {
  private baseUrl: string;
  private auth: ReturnType<typeof getAuth>;

  constructor(config: GeminiProxyConfig = {}) {
    // Default to production Functions URL (update with your project)
    this.baseUrl = config.baseUrl || 
      "https://us-central1-vantai.cloudfunctions.net";
    this.auth = getAuth();
  }

  /**
   * Get Firebase ID token for authenticated requests
   */
  private async getIdToken(): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }
    return await user.getIdToken();
  }

  /**
   * Make authenticated request to Cloud Function
   */
  private async request<T>(
    endpoint: string,
    method: string = "POST",
    body?: unknown
  ): Promise<T> {
    const idToken = await this.getIdToken();
    
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method,
      headers: {
        "Authorization": `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data as T;
  }

  /**
   * Generate a new image from text prompt
   * 
   * @example
   * const result = await client.generateImage("A mountain landscape");
   * console.log(result.imageData); // base64 or URL
   */
  async generateImage(
    options: string | GenerateImageOptions
  ): Promise<GeminiProxyResponse> {
    const requestBody = typeof options === "string" 
      ? {prompt: options}
      : options;

    return this.request<GeminiProxyResponse>("generateImage", "POST", requestBody);
  }

  /**
   * Edit an existing image with safety controls
   * 
   * @example
   * const result = await client.editImage({
   *   prompt: "Change hair color to blonde",
   *   imageData: base64Image,
   *   preserveIdentity: true
   * });
   */
  async editImage(options: EditImageOptions): Promise<GeminiProxyResponse> {
    return this.request<GeminiProxyResponse>("editImage", "POST", options);
  }

  /**
   * Admin-only: Manually approve a flagged edit request
   * 
   * @example
   * const result = await client.approveEdit({
   *   requestId: "req-123",
   *   prompt: "Artistic edit",
   *   imageData: base64Image,
   *   reason: "Legitimate artistic modification"
   * });
   */
  async approveEdit(options: AdminApprovalOptions): Promise<GeminiProxyResponse> {
    return this.request<GeminiProxyResponse>("approveEdit", "POST", options);
  }

  /**
   * Convert image file to base64 data URL
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert image URL to base64 data URL
   */
  static async urlToBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Validate image before sending (check size, format)
   */
  static validateImage(imageData: string): {valid: boolean; error?: string} {
    // Check if base64
    if (!imageData.startsWith("data:image/")) {
      return {
        valid: false,
        error: "Image must be a data URL (data:image/...)",
      };
    }

    // Check size (rough estimate: base64 is ~33% larger than binary)
    const sizeInBytes = (imageData.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);

    if (sizeInMB > 10) {
      return {
        valid: false,
        error: `Image too large: ${sizeInMB.toFixed(2)}MB (max 10MB)`,
      };
    }

    return {valid: true};
  }
}

/**
 * React Hook for Gemini Proxy
 * 
 * Usage:
 * const { generateImage, editImage, loading, error } = useGeminiProxy();
 */
export function useGeminiProxy() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const client = useMemo(() => new GeminiProxyClient(), []);

  const generateImage = useCallback(async (
    options: string | GenerateImageOptions
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await client.generateImage(options);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const editImage = useCallback(async (options: EditImageOptions) => {
    setLoading(true);
    setError(null);
    try {
      const result = await client.editImage(options);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const approveEdit = useCallback(async (options: AdminApprovalOptions) => {
    setLoading(true);
    setError(null);
    try {
      const result = await client.approveEdit(options);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  return {
    generateImage,
    editImage,
    approveEdit,
    loading,
    error,
  };
}

// Add these imports at the top of the file for the hook
import {useState, useCallback, useMemo} from "react";
