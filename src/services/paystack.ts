export interface PaystackConfig {
  key: string;
  email: string;
  amount: number;
  ref: string;
  metadata: {
    userId: string;
    plan: 'basic' | 'premium';
    custom_fields: Array<{
      display_name: string;
      variable_name: string;
      value: string;
    }>;
  };
  onSuccess: (reference: any) => void;
  onClose: () => void;
}

export class PaystackService {
  private publicKey: string;

  constructor() {
    this.publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';
  }

  initializePayment(config: PaystackConfig): void {
    const handler = (window as any).PaystackPop.setup({
      key: this.publicKey,
      email: config.email,
      amount: config.amount * 100, // Convert to kobo
      ref: config.ref,
      metadata: config.metadata,
      onClose: config.onClose,
      callback: config.onSuccess,
    });
    handler.openIframe();
  }

  generateReference(userId: string): string {
    return `${userId}_${Date.now()}`;
  }

  async verifyPayment(reference: string): Promise<boolean> {
    try {
      // In production, this should call your backend to verify with Paystack
      // For now, we'll assume success if reference exists
      return !!reference;
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }
}

export const paystackService = new PaystackService();
