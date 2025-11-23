/**
 * Custom hook for real-time messaging with optimistic UI updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import {
  sendMessage as sendMessageService,
  onMessages,
  onTypingIndicators,
  startTyping,
  stopTyping,
} from '../services/messagingService';
import type { MessageData } from '../services/messagingService';
import toast from 'react-hot-toast';

interface OptimisticMessage extends MessageData {
  id: string;
  pending?: boolean;
  error?: boolean;
}

export const useMessaging = (conversationId: string | null) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Listen for messages
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onMessages(conversationId, newMessages => {
      setMessages(
        newMessages.map(msg => ({
          ...msg,
          pending: false,
          error: false,
        }))
      );
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId]);

  // Listen for typing indicators
  useEffect(() => {
    if (!conversationId) {
      setTypingUsers([]);
      return;
    }

    const unsubscribe = onTypingIndicators(conversationId, users => {
      setTypingUsers(users);
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId]);

  // Send message with optimistic update
  const sendMessage = useCallback(
    async (
      text: string,
      type: 'text' | 'image' | 'file' = 'text',
      metadata?: MessageData['metadata'],
      storageRef?: string
    ): Promise<void> => {
      if (!conversationId || !currentUser) {
        toast.error('Cannot send message');
        return;
      }

      // Create optimistic message
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMessage: OptimisticMessage = {
        id: optimisticId,
        senderId: currentUser.uid,
        text: text.trim(),
        createdAt: Date.now(),
        type,
        pending: true,
        metadata,
        storageRef,
      };

      // Add optimistic message to UI
      setMessages(prev => [...prev, optimisticMessage]);

      // Stop typing indicator
      if (conversationId) {
        stopTyping(conversationId);
      }

      try {
        // Send to server
        await sendMessageService(
          conversationId,
          text,
          type,
          metadata,
          storageRef
        );

        // Remove optimistic message (real one will come via listener)
        setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      } catch (error) {
        console.error('Error sending message:', error);

        // Mark optimistic message as error
        setMessages(prev =>
          prev.map(msg =>
            msg.id === optimisticId ? { ...msg, pending: false, error: true } : msg
          )
        );

        toast.error('Failed to send message');

        // Remove failed message after 3 seconds
        setTimeout(() => {
          setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
        }, 3000);
      }
    },
    [conversationId, currentUser]
  );

  // Handle typing with debounce
  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (!conversationId) return;

      if (isTyping) {
        startTyping(conversationId);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Auto-stop after 3 seconds
        typingTimeoutRef.current = setTimeout(() => {
          stopTyping(conversationId);
        }, 3000);
      } else {
        stopTyping(conversationId);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    },
    [conversationId]
  );

  // Cleanup typing on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (conversationId) {
        stopTyping(conversationId);
      }
    };
  }, [conversationId]);

  return {
    messages,
    typingUsers,
    isLoading,
    error,
    sendMessage,
    handleTyping,
  };
};
