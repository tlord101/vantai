/**
 * Form Validation Utilities
 * 
 * Inline validation with toast notifications and field-level feedback.
 * Works with Formik or standalone.
 * 
 * Features:
 * - Real-time validation
 * - Toast notifications for errors
 * - Field-level error display
 * - Common validation rules
 */

import { showValidationToast } from './toast';

/**
 * Validation Rules
 */
export const validationRules = {
  required: (value: unknown, fieldName: string): string | null => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} is required`;
    }
    return null;
  },

  email: (value: string, fieldName = 'Email'): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return `${fieldName} must be a valid email address`;
    }
    return null;
  },

  minLength: (value: string, min: number, fieldName: string): string | null => {
    if (value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (value: string, max: number, fieldName: string): string | null => {
    if (value.length > max) {
      return `${fieldName} must be less than ${max} characters`;
    }
    return null;
  },

  password: (value: string, fieldName = 'Password'): string | null => {
    if (value.length < 8) {
      return `${fieldName} must be at least 8 characters`;
    }
    if (!/[A-Z]/.test(value)) {
      return `${fieldName} must contain at least one uppercase letter`;
    }
    if (!/[a-z]/.test(value)) {
      return `${fieldName} must contain at least one lowercase letter`;
    }
    if (!/[0-9]/.test(value)) {
      return `${fieldName} must contain at least one number`;
    }
    return null;
  },

  confirmPassword: (password: string, confirmPassword: string): string | null => {
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  },

  url: (value: string, fieldName = 'URL'): string | null => {
    try {
      new URL(value);
      return null;
    } catch {
      return `${fieldName} must be a valid URL`;
    }
  },

  number: (value: string, fieldName: string): string | null => {
    if (isNaN(Number(value))) {
      return `${fieldName} must be a number`;
    }
    return null;
  },

  min: (value: number, min: number, fieldName: string): string | null => {
    if (value < min) {
      return `${fieldName} must be at least ${min}`;
    }
    return null;
  },

  max: (value: number, max: number, fieldName: string): string | null => {
    if (value > max) {
      return `${fieldName} must be at most ${max}`;
    }
    return null;
  },

  fileSize: (file: File, maxSizeMB: number): string | null => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSizeMB}MB`;
    }
    return null;
  },

  fileType: (file: File, allowedTypes: string[]): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `File type must be one of: ${allowedTypes.join(', ')}`;
    }
    return null;
  },

  imageFile: (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return validationRules.fileType(file, allowedTypes);
  },
};

/**
 * Field Validator
 */
export class FieldValidator {
  private errors: Map<string, string> = new Map();

  validate(
    fieldName: string,
    value: unknown,
    rules: Array<(value: any) => string | null>
  ): boolean {
    for (const rule of rules) {
      const error = rule(value);
      if (error) {
        this.errors.set(fieldName, error);
        showValidationToast(fieldName, error);
        return false;
      }
    }
    this.errors.delete(fieldName);
    return true;
  }

  hasError(fieldName: string): boolean {
    return this.errors.has(fieldName);
  }

  getError(fieldName: string): string | undefined {
    return this.errors.get(fieldName);
  }

  clearError(fieldName: string): void {
    this.errors.delete(fieldName);
  }

  clearAll(): void {
    this.errors.clear();
  }

  get isValid(): boolean {
    return this.errors.size === 0;
  }
}

/**
 * Inline Field Error Component
 */
import { AlertCircle } from 'lucide-react';

interface FieldErrorProps {
  error?: string;
  touched?: boolean;
  className?: string;
}

export function FieldError({ error, touched = true, className = '' }: FieldErrorProps) {
  if (!error || !touched) return null;

  return (
    <div className={`flex items-center gap-2 mt-2 text-red-400 text-sm ${className}`}>
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
}

/**
 * Success Field Indicator
 */
import { CheckCircle } from 'lucide-react';

interface FieldSuccessProps {
  show: boolean;
  message?: string;
  className?: string;
}

export function FieldSuccess({ show, message, className = '' }: FieldSuccessProps) {
  if (!show) return null;

  return (
    <div className={`flex items-center gap-2 mt-2 text-green-400 text-sm ${className}`}>
      <CheckCircle className="w-4 h-4 flex-shrink-0" />
      {message && <span>{message}</span>}
    </div>
  );
}

/**
 * Field Wrapper with validation state
 */
interface ValidatedFieldProps {
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  success?: boolean;
  successMessage?: string;
  children: React.ReactNode;
  className?: string;
}

export function ValidatedField({
  label,
  error,
  touched,
  required,
  success,
  successMessage,
  children,
  className = '',
}: ValidatedFieldProps) {
  const hasError = error && touched;

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-white/90">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {hasError && <FieldError error={error} touched={touched} />}
      {success && !hasError && <FieldSuccess show={true} message={successMessage} />}
    </div>
  );
}

/**
 * Example usage with validation
 */
export const exampleValidation = {
  // Email field
  email: (value: string) => [
    () => validationRules.required(value, 'Email'),
    () => validationRules.email(value),
  ],

  // Password field
  password: (value: string) => [
    () => validationRules.required(value, 'Password'),
    () => validationRules.password(value),
  ],

  // Confirm password
  confirmPassword: (password: string, confirmPassword: string) => [
    () => validationRules.required(confirmPassword, 'Confirm Password'),
    () => validationRules.confirmPassword(password, confirmPassword),
  ],

  // Image upload
  imageUpload: (file: File) => [
    () => validationRules.required(file, 'Image'),
    () => validationRules.imageFile(file),
    () => validationRules.fileSize(file, 10), // 10MB max
  ],
};
