import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Message {
  id: string;
  content: string;
  is_user: boolean;
  file_id?: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const useChat = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load chat sessions
  const loadSessions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  // Load messages for a session
  const loadMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCurrentMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Create new session
  const createSession = async (title: string = 'New Chat') => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert([{
          user_id: user.id,
          title,
        }])
        .select()
        .single();

      if (error) throw error;
      await loadSessions();
      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };

  // Add message to session
  const addMessage = async (sessionId: string, content: string, isUser: boolean, fileId?: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          session_id: sessionId,
          content,
          is_user: isUser,
          file_id: fileId,
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Update session timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      // Reload messages and sessions
      await loadMessages(sessionId);
      await loadSessions();
      
      return data;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  };

  // Delete session
  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      await loadSessions();
      
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setCurrentMessages([]);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  // Switch to session
  const switchToSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    await loadMessages(sessionId);
  };

  // Start new chat
  const startNewChat = async () => {
    const session = await createSession();
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
    switchToSession,
    startNewChat,
    loadSessions,
  };
};