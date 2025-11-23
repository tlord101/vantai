/**
 * ImageEditor Modal Component
 * 
 * Provides AI-powered image editing with:
 * - Upload or select existing image
 * - Natural language edit instructions
 * - Intent preview before processing
 * - Custom processing modal with safety messaging
 * - Side-by-side comparison
 * - Save/rollback options
 */

import React, {useState, useRef, useCallback, useEffect} from "react";
import {GeminiProxyClient} from "../lib/geminiProxyClient";
import toast from "react-hot-toast";

interface ImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialImage?: string; // Optional: pre-selected image from messages
  onSaveToConversation?: (imageData: string, prompt: string) => Promise<void>;
  conversationId?: string;
}

interface EditIntent {
  prompt: string;
  summary: string;
  changes: string[];
}

type EditorStep = "upload" | "edit" | "preview-intent" | "processing" | "review";

export const ImageEditor: React.FC<ImageEditorProps> = ({
  isOpen,
  onClose,
  initialImage,
  onSaveToConversation,
  conversationId,
}) => {
  const [step, setStep] = useState<EditorStep>("upload");
  const [selectedImage, setSelectedImage] = useState<string | null>(initialImage || null);
  const [editPrompt, setEditPrompt] = useState("");
  const [editIntent, setEditIntent] = useState<EditIntent | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const client = new GeminiProxyClient();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialImage) {
        setSelectedImage(initialImage);
        setStep("edit");
      } else {
        setStep("upload");
      }
      setEditPrompt("");
      setEditIntent(null);
      setEditedImage(null);
      setError(null);
    }
  }, [isOpen, initialImage]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setSelectedImage(imageData);
      setStep("edit");
    };
    reader.onerror = () => {
      toast.error("Failed to read image file");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSelectImageClick = () => {
    fileInputRef.current?.click();
  };

  // Generate intent summary from prompt
  const generateIntentSummary = (prompt: string): EditIntent => {
    const lowerPrompt = prompt.toLowerCase();
    const changes: string[] = [];

    // Detect common edit types
    if (lowerPrompt.includes("hair")) {
      changes.push("Hair styling or color modification");
    }
    if (lowerPrompt.includes("background")) {
      changes.push("Background alteration");
    }
    if (lowerPrompt.includes("light") || lowerPrompt.includes("bright")) {
      changes.push("Lighting adjustment");
    }
    if (lowerPrompt.includes("color") || lowerPrompt.includes("saturation")) {
      changes.push("Color correction");
    }
    if (lowerPrompt.includes("makeup")) {
      changes.push("Makeup application");
    }
    if (lowerPrompt.includes("clothing") || lowerPrompt.includes("outfit")) {
      changes.push("Clothing modification");
    }
    
    // If no specific changes detected, add generic description
    if (changes.length === 0) {
      changes.push("General image enhancement");
    }

    return {
      prompt,
      summary: changes.join(", "),
      changes,
    };
  };

  const handlePreviewIntent = () => {
    if (!editPrompt.trim()) {
      toast.error("Please enter edit instructions");
      return;
    }

    const intent = generateIntentSummary(editPrompt);
    setEditIntent(intent);
    setStep("preview-intent");
  };

  const handleCancelIntent = () => {
    setEditIntent(null);
    setStep("edit");
  };

  const handleConfirmIntent = async () => {
    if (!selectedImage || !editPrompt) return;

    setStep("processing");
    setError(null);

    try {
      const result = await client.editImage({
        prompt: editPrompt,
        imageData: selectedImage,
        conversationId,
        preserveIdentity: true,
      });

      if (result.success && result.imageData) {
        setEditedImage(result.imageData);
        setStep("review");
        toast.success("Image edited successfully!");
      } else {
        throw new Error(result.error || "Failed to edit image");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to edit image";
      setError(errorMessage);
      toast.error(errorMessage);
      setStep("edit");
    }
  };

  const handleSaveEdited = async () => {
    if (!editedImage) return;

    try {
      if (onSaveToConversation) {
        await onSaveToConversation(editedImage, editPrompt);
        toast.success("Edited image saved to conversation");
      }
      handleClose();
    } catch (err) {
      toast.error("Failed to save edited image");
    }
  };

  const handleRejectEdited = () => {
    // Rollback - don't save, return to edit step
    setEditedImage(null);
    setStep("edit");
    toast("Edit discarded. You can try again.", { icon: "ℹ️" });
  };

  const handleClose = () => {
    setSelectedImage(null);
    setEditPrompt("");
    setEditIntent(null);
    setEditedImage(null);
    setError(null);
    setStep("upload");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="liquid-glass max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-glass-primary">
              🎨 AI Image Editor
            </h2>
            <button
              onClick={handleClose}
              className="text-glass-secondary hover:text-glass-primary transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {step === "upload" && (
            <UploadStep
              onImageUpload={handleImageUpload}
              onSelectClick={handleSelectImageClick}
              fileInputRef={fileInputRef}
            />
          )}

          {step === "edit" && selectedImage && (
            <EditStep
              image={selectedImage}
              prompt={editPrompt}
              onPromptChange={setEditPrompt}
              onPreview={handlePreviewIntent}
              onCancel={handleClose}
            />
          )}

          {step === "preview-intent" && editIntent && (
            <IntentPreviewStep
              intent={editIntent}
              onConfirm={handleConfirmIntent}
              onCancel={handleCancelIntent}
            />
          )}

          {step === "processing" && (
            <ProcessingStep />
          )}

          {step === "review" && selectedImage && editedImage && (
            <ReviewStep
              originalImage={selectedImage}
              editedImage={editedImage}
              prompt={editPrompt}
              onSave={handleSaveEdited}
              onReject={handleRejectEdited}
            />
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Upload Step Component
interface UploadStepProps {
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const UploadStep: React.FC<UploadStepProps> = ({
  onImageUpload,
  onSelectClick,
  fileInputRef,
}) => {
  return (
    <div className="text-center py-12">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onImageUpload}
        className="hidden"
      />
      
      <div className="mb-6">
        <svg
          className="w-24 h-24 mx-auto text-glass-secondary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>

      <h3 className="text-xl font-semibold text-glass-primary mb-2">
        Upload an Image
      </h3>
      <p className="text-glass-secondary mb-6">
        Select a photo to edit with AI (max 10MB)
      </p>

      <button
        onClick={onSelectClick}
        className="button-glass px-8 py-3 rounded-xl font-medium"
      >
        Choose Image
      </button>

      <div className="mt-8 text-sm text-glass-tertiary">
        <p className="mb-2">✅ Supported: Hair, makeup, lighting, background</p>
        <p>🛡️ Identity preservation: Facial structure is protected</p>
      </div>
    </div>
  );
};

// Edit Step Component
interface EditStepProps {
  image: string;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onPreview: () => void;
  onCancel: () => void;
}

const EditStep: React.FC<EditStepProps> = ({
  image,
  prompt,
  onPromptChange,
  onPreview,
  onCancel,
}) => {
  return (
    <div className="space-y-6">
      {/* Image Preview */}
      <div className="rounded-xl overflow-hidden border border-white/10">
        <img
          src={image}
          alt="Original"
          className="w-full h-64 object-contain bg-black/20"
        />
      </div>

      {/* Edit Instructions */}
      <div>
        <label className="block text-sm font-medium text-glass-primary mb-2">
          What would you like to change?
        </label>
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="E.g., Change hair color to auburn, increase brightness, add warm sunset lighting..."
          className="input-glass w-full h-32 resize-none"
          autoFocus
        />
        <p className="mt-2 text-xs text-glass-tertiary">
          Use natural language. AI will preserve facial structure and identity.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-6 py-2 rounded-lg text-glass-secondary hover:text-glass-primary transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onPreview}
          disabled={!prompt.trim()}
          className="button-glass px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Preview Changes →
        </button>
      </div>
    </div>
  );
};

// Intent Preview Step Component
interface IntentPreviewStepProps {
  intent: EditIntent;
  onConfirm: () => void;
  onCancel: () => void;
}

const IntentPreviewStep: React.FC<IntentPreviewStepProps> = ({
  intent,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-4">
          <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-glass-primary mb-2">
          Preview Your Edit
        </h3>
        <p className="text-glass-secondary">
          Please confirm the changes you want to make
        </p>
      </div>

      {/* Intent Summary */}
      <div className="liquid-glass-subtle rounded-xl p-6 space-y-4">
        <div>
          <h4 className="text-sm font-medium text-glass-secondary mb-2">
            Your Instructions:
          </h4>
          <p className="text-glass-primary italic">"{intent.prompt}"</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-glass-secondary mb-2">
            What Will Change:
          </h4>
          <ul className="space-y-2">
            {intent.changes.map((change, index) => (
              <li key={index} className="flex items-start gap-2 text-glass-primary">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{change}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 border-t border-white/10">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-glass-tertiary">
              <strong className="text-glass-secondary">Protected:</strong> Facial structure,
              proportions, and identity will be preserved.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-6 py-2 rounded-lg text-glass-secondary hover:text-glass-primary transition-colors"
        >
          ← Back to Edit
        </button>
        <button
          onClick={onConfirm}
          className="button-glass px-6 py-2 rounded-lg font-medium"
        >
          Confirm & Process
        </button>
      </div>
    </div>
  );
};

// Processing Step Component
const ProcessingStep: React.FC = () => {
  return (
    <div className="text-center py-12">
      {/* Animated Logo/Spinner */}
      <div className="relative mb-8">
        <div className="inline-flex items-center justify-center">
          {/* Spinning border */}
          <div className="absolute w-24 h-24 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin" />
          
          {/* Logo placeholder - replace with your actual logo */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-3xl">🎨</span>
          </div>
        </div>
      </div>

      <h3 className="text-xl font-semibold text-glass-primary mb-2">
        Editing Your Image
      </h3>
      <p className="text-glass-secondary mb-6">
        This may take a few moments...
      </p>

      {/* Safety Message */}
      <div className="liquid-glass-subtle rounded-xl p-6 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div className="text-left">
            <p className="text-glass-primary font-medium mb-1">
              AI Safety Active
            </p>
            <p className="text-sm text-glass-secondary">
              We are editing your image while preserving facial structure,
              proportions, and identity. Your safety is our priority.
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mt-8 space-y-3 max-w-md mx-auto">
        <div className="flex items-center gap-3 text-sm text-glass-secondary">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>Analyzing image...</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-glass-secondary">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse animation-delay-200" />
          <span>Applying AI edits...</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-glass-secondary">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse animation-delay-400" />
          <span>Verifying safety policies...</span>
        </div>
      </div>
    </div>
  );
};

// Review Step Component
interface ReviewStepProps {
  originalImage: string;
  editedImage: string;
  prompt: string;
  onSave: () => void;
  onReject: () => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  originalImage,
  editedImage,
  prompt,
  onSave,
  onReject,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-glass-primary mb-2">
          Review Your Edit
        </h3>
        <p className="text-glass-secondary">
          Compare the original and edited versions
        </p>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-glass-secondary text-center">
            Original
          </h4>
          <div className="rounded-xl overflow-hidden border border-white/10">
            <img
              src={originalImage}
              alt="Original"
              className="w-full h-64 object-contain bg-black/20"
            />
          </div>
        </div>

        {/* Edited */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-glass-secondary text-center">
            AI Edited
          </h4>
          <div className="rounded-xl overflow-hidden border-2 border-blue-500/50">
            <img
              src={editedImage}
              alt="Edited"
              className="w-full h-64 object-contain bg-black/20"
            />
          </div>
        </div>
      </div>

      {/* Edit summary */}
      <div className="liquid-glass-subtle rounded-xl p-4">
        <p className="text-sm text-glass-secondary mb-1">Applied Edit:</p>
        <p className="text-glass-primary italic">"{prompt}"</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-between">
        <button
          onClick={onReject}
          className="px-6 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-colors border border-red-500/30"
        >
          ✗ Discard Edit
        </button>
        <button
          onClick={onSave}
          className="button-glass px-6 py-2 rounded-lg font-medium"
        >
          ✓ Save to Conversation
        </button>
      </div>

      <p className="text-xs text-center text-glass-tertiary">
        Discarding will not save the edit. You can try editing again.
      </p>
    </div>
  );
};

export default ImageEditor;
