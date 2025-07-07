
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Message, ChatSession } from '@/types/chat';
import { chatSessionService } from '@/services/chatSessionService';
import { chatMessageService } from '@/services/chatMessageService';

export const useChat = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load chat sessions (excluding archived ones by default)
  const loadSessions = async (includeArchived = false) => {
    if (!user) return;
    
    const sessions = await chatSessionService.loadSessions(user.id, includeArchived);
    setSessions(sessions);
  };

  // Load messages for a session
  const loadMessages = async (sessionId: string) => {
    const messages = await chatMessageService.loadMessages(sessionId);
    setCurrentMessages(messages);
  };

  // Create new session
  const createSession = async (title: string = 'New Chat', metadata: Record<string, any> = {}) => {
    if (!user) return null;

    const session = await chatSessionService.createSession(user.id, title, metadata);
    if (session) {
      await loadSessions();
    }
    return session;
  };

  // Add message to session
  const addMessage = async (sessionId: string, content: string, sender: 'user' | 'bot') => {
    const result = await chatMessageService.addMessage(sessionId, content, sender);
    if (result) {
      // Reload messages and sessions
      await loadMessages(sessionId);
      await loadSessions();
    }
    return result;
  };

  // Archive session
  const archiveSession = async (sessionId: string) => {
    const success = await chatSessionService.archiveSession(sessionId);
    if (success) {
      await loadSessions(); // Reload sessions to update the list
      
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setCurrentMessages([]);
      }
    }
  };

  // Rate session
  const rateSession = async (sessionId: string, rating: number, feedback?: string) => {
    const success = await chatSessionService.rateSession(sessionId, rating, feedback);
    if (success) {
      await loadSessions();
    }
  };

  // Delete session
  const deleteSession = async (sessionId: string) => {
    const success = await chatSessionService.deleteSession(sessionId);
    if (success) {
      await loadSessions();
      
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setCurrentMessages([]);
      }
    }
  };

  // Switch to session
  const switchToSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    await loadMessages(sessionId);
  };

  // Start new chat
  const startNewChat = async (metadata: Record<string, any> = {}) => {
    const session = await createSession('New Chat', metadata);
    if (session) {
      setCurrentSessionId(session.id);
      setCurrentMessages([]);
    }
    return session;
  };

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  return {
    sessions,
    currentMessages,
    currentSessionId,
    loading,
    createSession,
    addMessage,
    deleteSession,
    archiveSession,
    rateSession,
    switchToSession,
    startNewChat,
    loadSessions,
  };
};

// Re-export types for convenience
export type { Message, ChatSession };
