/**
 * Firebase Realtime Database Helper Functions
 * Provides typed helper functions for common RTDB operations
 */

import { ref, set, get, update, onValue, push } from 'firebase/database';
import { rtdb } from './firebase';

// Type definitions
export interface UserProfile {
  name: string;
  email: string;
  photoURL?: string;
  createdAt: number;
}

export interface UserData {
  profile: UserProfile;
  credits: number;
  subscription?: {
    plan: 'free' | 'premium' | 'enterprise';
    status: 'active' | 'inactive' | 'cancelled';
    startDate: number;
    endDate?: number;
  };
}

export interface Message {
  senderId: string;
  text: string;
  createdAt: number;
  type: 'text' | 'image' | 'file';
  storageRef?: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  };
}

export interface Conversation {
  participants: { [uid: string]: boolean };
  lastMessage: {
    text: string;
    senderId: string;
    createdAt: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface UserStatus {
  state: 'online' | 'offline';
  lastChanged: number;
}

// User operations
export const createUserProfile = async (
  uid: string,
  profile: UserProfile
): Promise<void> => {
  const userRef = ref(rtdb, `users/${uid}`);
  await set(userRef, {
    profile,
    credits: 0,
  });
};

export const getUserProfile = async (uid: string): Promise<UserData | null> => {
  const userRef = ref(rtdb, `users/${uid}`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? snapshot.val() : null;
};

export const updateUserProfile = async (
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  const profileRef = ref(rtdb, `users/${uid}/profile`);
  await update(profileRef, updates);
};

// Message operations
export const sendMessage = async (
  conversationId: string,
  message: Message
): Promise<string> => {
  const messagesRef = ref(rtdb, `messages/${conversationId}`);
  const newMessageRef = push(messagesRef);
  await set(newMessageRef, message);

  // Update conversation's lastMessage
  const conversationRef = ref(rtdb, `conversations/${conversationId}`);
  await update(conversationRef, {
    lastMessage: {
      text: message.text,
      senderId: message.senderId,
      createdAt: message.createdAt,
    },
    updatedAt: Date.now(),
  });

  return newMessageRef.key!;
};

export const getMessages = async (
  conversationId: string
): Promise<Message[]> => {
  const messagesRef = ref(rtdb, `messages/${conversationId}`);
  const snapshot = await get(messagesRef);
  if (!snapshot.exists()) return [];

  const messages: Message[] = [];
  snapshot.forEach(child => {
    messages.push(child.val());
  });
  return messages;
};

// Conversation operations
export const createConversation = async (
  participantUids: string[]
): Promise<string> => {
  const conversationsRef = ref(rtdb, 'conversations');
  const newConversationRef = push(conversationsRef);

  const participants: { [uid: string]: boolean } = {};
  participantUids.forEach(uid => {
    participants[uid] = true;
  });

  const conversation: Conversation = {
    participants,
    lastMessage: {
      text: '',
      senderId: '',
      createdAt: Date.now(),
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await set(newConversationRef, conversation);
  return newConversationRef.key!;
};

// User status operations
export const setUserStatus = async (
  uid: string,
  status: 'online' | 'offline'
): Promise<void> => {
  const statusRef = ref(rtdb, `user_status/${uid}`);
  await set(statusRef, {
    state: status,
    lastChanged: Date.now(),
  });
};

export const subscribeToUserStatus = (
  uid: string,
  callback: (status: UserStatus | null) => void
): (() => void) => {
  const statusRef = ref(rtdb, `user_status/${uid}`);
  const unsubscribe = onValue(statusRef, snapshot => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
  return unsubscribe;
};

// Realtime listeners
export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  const messagesRef = ref(rtdb, `messages/${conversationId}`);
  const unsubscribe = onValue(messagesRef, snapshot => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const messages: Message[] = [];
    snapshot.forEach(child => {
      messages.push({ ...child.val(), id: child.key });
    });
    callback(messages);
  });
  return unsubscribe;
};

export const subscribeToConversations = (
  uid: string,
  callback: (conversations: Array<Conversation & { id: string }>) => void
): (() => void) => {
  const conversationsRef = ref(rtdb, 'conversations');
  const unsubscribe = onValue(conversationsRef, snapshot => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const conversations: Array<Conversation & { id: string }> = [];
    snapshot.forEach(child => {
      const conv = child.val();
      if (conv.participants && conv.participants[uid]) {
        conversations.push({ ...conv, id: child.key! });
      }
    });
    callback(conversations);
  });
  return unsubscribe;
};
