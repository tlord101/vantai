/**
 * Custom hook for user presence management
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import {
  onUserPresence,
  initializePresence,
  setUserPresence,
} from '../services/messagingService';
import type { PresenceData } from '../services/messagingService';

export const usePresence = (uid?: string) => {
  const { currentUser } = useAuth();
  const [presence, setPresence] = useState<PresenceData | null>(null);

  // Initialize presence for current user
  useEffect(() => {
    if (currentUser && !uid) {
      initializePresence();

      return () => {
        setUserPresence(false);
      };
    }
  }, [currentUser, uid]);

  // Listen to specific user presence
  useEffect(() => {
    if (!uid) return;

    const unsubscribe = onUserPresence(uid, presenceData => {
      setPresence(presenceData);
    });

    return () => {
      unsubscribe();
    };
  }, [uid]);

  return {
    isOnline: presence?.isOnline || false,
    lastSeen: presence?.lastSeen || null,
  };
};

/**
 * Hook for monitoring multiple users' presence
 */
export const useMultiplePresence = (uids: string[]) => {
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceData>>({});

  useEffect(() => {
    if (uids.length === 0) return;

    const unsubscribers: (() => void)[] = [];

    uids.forEach(uid => {
      const unsubscribe = onUserPresence(uid, presenceData => {
        setPresenceMap(prev => ({
          ...prev,
          [uid]: presenceData || { isOnline: false, lastSeen: 0 },
        }));
      });

      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [uids.join(',')]);

  return presenceMap;
};
