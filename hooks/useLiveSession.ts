// hooks/useLiveSession.ts - Fixed to pass context properly
"use client";

import { useState, useCallback } from 'react';

interface LiveSessionData {
  roomUrl: string;
  sessionId: string;
  conversationId: string;
  sessionType: string;
  topic?: string;
}

export function useLiveSession() {
  const [activeSession, setActiveSession] = useState<LiveSessionData | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const startSession = useCallback(async (context: any) => {
    setIsStarting(true);
    try {
      const response = await fetch('/api/tutor/start-contextual-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // FIXED: Pass context properly
        body: JSON.stringify({ context }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start live session');
      }

      setActiveSession({
        roomUrl: result.roomUrl,
        sessionId: result.sessionId,
        conversationId: result.conversationId,
        sessionType: result.sessionType || context.sessionType || 'initial',
        topic: result.topic || context.topic
      });

      return result;
    } finally {
      setIsStarting(false);
    }
  }, []);

  const endSession = useCallback(async () => {
    if (activeSession) {
      try {
        // Optionally call an API to end the session
        await fetch('/api/tutor/end-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: activeSession.sessionId,
            conversationId: activeSession.conversationId
          }),
        });
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }
    setActiveSession(null);
  }, [activeSession]);

  const closeSession = useCallback(() => {
    setActiveSession(null);
  }, []);

  return {
    activeSession,
    isStarting,
    startSession,
    endSession,
    closeSession
  };
}