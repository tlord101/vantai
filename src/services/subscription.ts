import { getFirestore, doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { app } from './firebase';

const db = getFirestore(app);

export type SubscriptionPlan = 'free' | 'basic' | 'premium';

export interface SubscriptionData {
  plan: SubscriptionPlan;
  startDate: Date;
  endDate: Date;
  imagesUsedToday: number;
  lastResetDate: string;
  paymentReference?: string;
}

export interface PlanLimits {
  name: string;
  price: number;
  dailyImageLimit: number;
  features: string[];
}

export const PLANS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    name: 'Free',
    price: 0,
    dailyImageLimit: 0,
    features: ['Preview mode only', 'No image generation', 'Basic support'],
  },
  basic: {
    name: 'Basic',
    price: 15000,
    dailyImageLimit: 10,
    features: ['10 AI images per day', 'Text-to-image', 'Image-to-image editing', 'Priority support', 'Generation history'],
  },
  premium: {
    name: 'Premium',
    price: 25000,
    dailyImageLimit: -1, // -1 means unlimited
    features: ['Unlimited AI images', 'Text-to-image', 'Image-to-image editing', 'Premium support', 'HD quality', 'Generation history', 'Priority processing'],
  },
};

class SubscriptionService {
  async getUserSubscription(userId: string): Promise<SubscriptionData | null> {
    try {
      const docRef = doc(db, 'subscriptions', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          plan: data.plan,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          imagesUsedToday: data.imagesUsedToday || 0,
          lastResetDate: data.lastResetDate || new Date().toDateString(),
          paymentReference: data.paymentReference,
        };
      }

      // No subscription found, create free plan
      const freeSubscription: SubscriptionData = {
        plan: 'free',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        imagesUsedToday: 0,
        lastResetDate: new Date().toDateString(),
      };

      await this.createSubscription(userId, freeSubscription);
      return freeSubscription;
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }

  async createSubscription(userId: string, data: SubscriptionData): Promise<void> {
    try {
      const docRef = doc(db, 'subscriptions', userId);
      await setDoc(docRef, {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  async upgradeSubscription(
    userId: string,
    plan: SubscriptionPlan,
    paymentReference: string
  ): Promise<void> {
    try {
      const docRef = doc(db, 'subscriptions', userId);
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

      await setDoc(docRef, {
        plan,
        startDate: now,
        endDate,
        imagesUsedToday: 0,
        lastResetDate: now.toDateString(),
        paymentReference,
        updatedAt: now,
      }, { merge: true });
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      throw error;
    }
  }

  async checkImageLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        return { allowed: false, remaining: 0 };
      }

      // Check if subscription is active
      if (subscription.plan !== 'free' && new Date() > subscription.endDate) {
        // Subscription expired, downgrade to free
        await this.upgradeSubscription(userId, 'free', 'expired');
        return { allowed: false, remaining: 0 };
      }

      const plan = PLANS[subscription.plan];

      // Premium has unlimited images
      if (plan.dailyImageLimit === -1) {
        return { allowed: true, remaining: -1 };
      }

      // Reset daily counter if it's a new day
      const today = new Date().toDateString();
      if (subscription.lastResetDate !== today) {
        await this.resetDailyImageCount(userId);
        return { allowed: plan.dailyImageLimit > 0, remaining: plan.dailyImageLimit };
      }

      const remaining = plan.dailyImageLimit - subscription.imagesUsedToday;
      return { allowed: remaining > 0, remaining };
    } catch (error) {
      console.error('Error checking image limit:', error);
      return { allowed: false, remaining: 0 };
    }
  }

  async incrementImageCount(userId: string): Promise<void> {
    try {
      const docRef = doc(db, 'subscriptions', userId);
      await updateDoc(docRef, {
        imagesUsedToday: increment(1),
      });
    } catch (error) {
      console.error('Error incrementing image count:', error);
    }
  }

  async resetDailyImageCount(userId: string): Promise<void> {
    try {
      const docRef = doc(db, 'subscriptions', userId);
      await updateDoc(docRef, {
        imagesUsedToday: 0,
        lastResetDate: new Date().toDateString(),
      });
    } catch (error) {
      console.error('Error resetting image count:', error);
    }
  }

  async isSubscriptionActive(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) return false;

      // Free plan is always "active" but with limitations
      if (subscription.plan === 'free') return false;

      // Check if paid subscription is still valid
      return new Date() <= subscription.endDate;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }
}

export const subscriptionService = new SubscriptionService();
