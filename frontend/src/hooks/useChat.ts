import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Message, ChatSession } from '@/types/chat';
import { chatSessionService } from '@/services/chatSessionService';
import { chatMessageService } from '@/services/chatMessageService';
import localforage from 'localforage';

const SESSIONS_KEY = 'chat_sessions';
const MESSAGES_KEY = (sessionId: string) => `chat_messages_${sessionId}`;

function mergeById<T extends { id: string }>(oldArr: T[], newArr: T[]): T[] {
  const map = new Map<string, T>();
  oldArr.forEach(item => map.set(item.id, item));
  newArr.forEach(item => map.set(item.id, item));
  return Array.from(map.values());
}

export const useChat = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Hydrate from cache on load
  useEffect(() => {
    if (!user) return;
    (async () => {
      const cachedSessions = await localforage.getItem<ChatSession[]>(SESSIONS_KEY);
      if (cachedSessions) setSessions(cachedSessions);
      if (currentSessionId) {
        const cachedMessages = await localforage.getItem<Message[]>(MESSAGES_KEY(currentSessionId));
        if (cachedMessages) setCurrentMessages(cachedMessages);
      }
      // Then sync with Supabase
      await loadSessions();
      if (currentSessionId) await loadMessages(currentSessionId);
    })();
    // eslint-disable-next-line
  }, [user]);

  // Save sessions/messages to cache on change
  useEffect(() => {
    if (sessions.length) localforage.setItem(SESSIONS_KEY, sessions);
  }, [sessions]);
  useEffect(() => {
    if (currentSessionId && currentMessages.length) {
      localforage.setItem(MESSAGES_KEY(currentSessionId), currentMessages);
    }
  }, [currentSessionId, currentMessages]);

  // Load chat sessions (merge with cache)
  const loadSessions = async () => {
    if (!user) return;
    const supaSessions = await chatSessionService.loadSessions(user.id);
    setSessions(prev => {
      const merged = mergeById(prev, supaSessions);
      localforage.setItem(SESSIONS_KEY, merged);
      return merged;
    });
  };

  // Load messages for a session (merge with cache)
  const loadMessages = async (sessionId: string) => {
    const supaMessages = await chatMessageService.loadMessages(sessionId);
    setCurrentMessages(prev => {
      const merged = mergeById(prev, supaMessages);
      localforage.setItem(MESSAGES_KEY(sessionId), merged);
      console.log('Loaded messages from Supabase and merged:', merged);
      return merged;
    });
  };

  // Create new session (optimistic)
  const createSession = async (title: string = 'New Chat') => {
    if (!user) return null;
    // Optimistically add to UI/cache
    const tempId = 'temp-' + Date.now();
    const optimisticSession: ChatSession = {
      id: tempId,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_archived: false,
    };
    setSessions(prev => [optimisticSession, ...prev]);
    await localforage.setItem(SESSIONS_KEY, [optimisticSession, ...sessions]);
    // Sync to Supabase
    const session = await chatSessionService.createSession(user.id, title);
    if (session) {
      setSessions(prev => [session, ...prev.filter(s => s.id !== tempId)]);
      await localforage.setItem(SESSIONS_KEY, [session, ...sessions.filter(s => s.id !== tempId)]);
      await loadSessions();
    }
    return session;
  };

  // Add message to session (optimistic)
  const addMessage = async (sessionId: string, content: string, sender: 'user' | 'bot') => {
    // Optimistically add to UI/cache
    const tempId = 'temp-' + Date.now();
    const optimisticMsg: Message = {
      id: tempId,
      content,
      session_id: sessionId,
      created_at: new Date().toISOString(),
      sender,
    };
    setCurrentMessages(prev => {
      const updated = [...prev, optimisticMsg];
      localforage.setItem(MESSAGES_KEY(sessionId), updated);
      return updated;
    });
    // Sync to Supabase
    const result = await chatMessageService.addMessage(sessionId, content, sender);
    if (result) {
      setCurrentMessages(prev => {
        const updated = [...prev.filter(m => m.id !== tempId), result];
        localforage.setItem(MESSAGES_KEY(sessionId), updated);
        return updated;
      });
      await loadMessages(sessionId);
      await loadSessions();
    }
    return result;
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
      await localforage.removeItem(MESSAGES_KEY(sessionId));
    }
  };

  // Switch to session
  const switchToSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    // Try cache first
    const cachedMessages = await localforage.getItem<Message[]>(MESSAGES_KEY(sessionId));
    if (cachedMessages) {
      setCurrentMessages(cachedMessages);
      console.log('Loaded messages from cache:', cachedMessages);
    }
    // Always fetch from Supabase and merge
    await loadMessages(sessionId);
  };

  // Start new chat
  const startNewChat = async () => {
    const session = await createSession('New Chat');
    if (session) {
      setCurrentSessionId(session.id);
      setCurrentMessages([]);
    }
    return session;
  };

  return {
    sessions,
    currentMessages,
    currentSessionId,
    loading,
    createSession,
    addMessage,
    deleteSession,
    switchToSession,
    startNewChat,
    loadSessions,
  };
};

// Re-export types for convenience
export type { Message, ChatSession };
