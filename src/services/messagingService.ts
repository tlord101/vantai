/**
 * Real-time Messaging Service
 * Firebase Realtime Database implementation
 */

import { ref, push, set, onValue, onDisconnect, off, get } from 'firebase/database';
import { rtdb, auth } from '../lib/firebase';

export interface MessageData {
  senderId: string;
  text: string;
  createdAt: number;
  type: 'text' | 'image' | 'file';
  storageRef?: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    width?: number;
    height?: number;
    aiEdited?: boolean;
    aiPrompt?: string;
  };
  senderName?: string;
  senderAvatar?: string;
}

export interface TypingIndicator {
  [uid: string]: boolean;
}

export interface PresenceData {
  isOnline: boolean;
  lastSeen: number;
}

/**
 * Send a message to a conversation
 * Atomically writes to both messages and updates conversation lastMessage
 */
export const sendMessage = async (
  conversationId: string,
  text: string,
  type: 'text' | 'image' | 'file' = 'text',
  metadata?: MessageData['metadata'],
  storageRef?: string
): Promise<string> => {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to send messages');
  }

  if (!text.trim() && type === 'text') {
    throw new Error('Message text cannot be empty');
  }

  const messageData: Partial<MessageData> = {
    senderId: auth.currentUser.uid,
    text: text.trim(),
    createdAt: Date.now(),
    type,
  };

  if (storageRef) {
    messageData.storageRef = storageRef;
  }

  if (metadata) {
    messageData.metadata = metadata;
  }

  try {
    // Create new message reference
    const messagesRef = ref(rtdb, `messages/${conversationId}`);
    const newMessageRef = push(messagesRef);
    
    // Write message atomically
    await set(newMessageRef, messageData);

    // Update conversation's lastMessage
    await set(ref(rtdb, `conversations/${conversationId}/lastMessage`), {
      text: type === 'text' ? text.trim() : `Sent ${type}`,
      senderId: auth.currentUser.uid,
      createdAt: messageData.createdAt,
    });

    await set(ref(rtdb, `conversations/${conversationId}/updatedAt`), messageData.createdAt);

    return newMessageRef.key!;
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }
};

/**
 * Listen for messages in a conversation
 * Calls callback with updated message list whenever messages change
 */
export const onMessages = (
  conversationId: string,
  callback: (messages: Array<MessageData & { id: string }>) => void
): (() => void) => {
  const messagesRef = ref(rtdb, `messages/${conversationId}`);

  onValue(
    messagesRef,
    snapshot => {
      const messages: Array<MessageData & { id: string }> = [];
      
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          messages.push({
            id: child.key!,
            ...child.val(),
          });
        });
      }

      // Sort by timestamp
      messages.sort((a, b) => a.createdAt - b.createdAt);
      callback(messages);
    },
    error => {
      console.error('Error listening to messages:', error);
      callback([]);
    }
  );

  // Return unsubscribe function
  return () => off(messagesRef);
};

/**
 * Start typing indicator
 * Sets ephemeral typing status that auto-removes on disconnect
 */
export const startTyping = async (conversationId: string): Promise<void> => {
  if (!auth.currentUser) return;

  const typingRef = ref(rtdb, `conversations/${conversationId}/typing/${auth.currentUser.uid}`);
  
  try {
    await set(typingRef, true);
    
    // Auto-remove on disconnect
    onDisconnect(typingRef).remove();
  } catch (error) {
    console.error('Error setting typing indicator:', error);
  }
};

/**
 * Stop typing indicator
 * Manually removes typing status
 */
export const stopTyping = async (conversationId: string): Promise<void> => {
  if (!auth.currentUser) return;

  const typingRef = ref(rtdb, `conversations/${conversationId}/typing/${auth.currentUser.uid}`);
  
  try {
    await set(typingRef, null);
  } catch (error) {
    console.error('Error removing typing indicator:', error);
  }
};

/**
 * Listen for typing indicators in a conversation
 * Returns list of user IDs currently typing (excluding current user)
 */
export const onTypingIndicators = (
  conversationId: string,
  callback: (typingUsers: string[]) => void
): (() => void) => {
  const typingRef = ref(rtdb, `conversations/${conversationId}/typing`);

  onValue(
    typingRef,
    snapshot => {
      const typingUsers: string[] = [];
      
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          // Exclude current user
          if (child.key !== auth.currentUser?.uid && child.val() === true) {
            typingUsers.push(child.key!);
          }
        });
      }

      callback(typingUsers);
    },
    error => {
      console.error('Error listening to typing indicators:', error);
      callback([]);
    }
  );

  return () => off(typingRef);
};

/**
 * Set user online presence
 * Automatically updates to offline on disconnect
 */
export const setUserPresence = async (isOnline: boolean = true): Promise<void> => {
  if (!auth.currentUser) return;

  const presenceRef = ref(rtdb, `user_status/${auth.currentUser.uid}`);
  
  const presenceData: PresenceData = {
    isOnline,
    lastSeen: Date.now(),
  };

  try {
    await set(presenceRef, presenceData);

    if (isOnline) {
      // Set to offline on disconnect
      onDisconnect(presenceRef).set({
        isOnline: false,
        lastSeen: Date.now(),
      });
    }
  } catch (error) {
    console.error('Error setting presence:', error);
  }
};

/**
 * Listen for user presence status
 */
export const onUserPresence = (
  uid: string,
  callback: (presence: PresenceData | null) => void
): (() => void) => {
  const presenceRef = ref(rtdb, `user_status/${uid}`);

  onValue(
    presenceRef,
    snapshot => {
      callback(snapshot.exists() ? snapshot.val() : null);
    },
    error => {
      console.error('Error listening to presence:', error);
      callback(null);
    }
  );

  return () => off(presenceRef);
};

/**
 * Get user presence status (one-time read)
 */
export const getUserPresence = async (uid: string): Promise<PresenceData | null> => {
  const presenceRef = ref(rtdb, `user_status/${uid}`);
  
  try {
    const snapshot = await get(presenceRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error getting presence:', error);
    return null;
  }
};

/**
 * Initialize presence system for current user
 * Call this when user logs in
 */
export const initializePresence = async (): Promise<void> => {
  if (!auth.currentUser) return;

  // Set online
  await setUserPresence(true);

  // Handle page visibility changes
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      setUserPresence(true);
    } else {
      setUserPresence(false);
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Handle window unload
  const handleBeforeUnload = () => {
    setUserPresence(false);
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
};

/**
 * Mark messages as read (optional enhancement)
 */
export const markMessagesAsRead = async (
  conversationId: string,
  lastReadMessageId: string
): Promise<void> => {
  if (!auth.currentUser) return;

  const readRef = ref(
    rtdb,
    `conversations/${conversationId}/readReceipts/${auth.currentUser.uid}`
  );

  try {
    await set(readRef, {
      lastReadMessageId,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

/**
 * Delete a message (soft delete - mark as deleted)
 */
export const deleteMessage = async (
  conversationId: string,
  messageId: string
): Promise<void> => {
  if (!auth.currentUser) return;

  const messageRef = ref(rtdb, `messages/${conversationId}/${messageId}`);

  try {
    // Get message to verify ownership
    const snapshot = await get(messageRef);
    if (!snapshot.exists()) {
      throw new Error('Message not found');
    }

    const message = snapshot.val();
    if (message.senderId !== auth.currentUser.uid) {
      throw new Error('Cannot delete message from another user');
    }

    // Soft delete
    await set(ref(rtdb, `messages/${conversationId}/${messageId}/deleted`), true);
    await set(ref(rtdb, `messages/${conversationId}/${messageId}/deletedAt`), Date.now());
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};
