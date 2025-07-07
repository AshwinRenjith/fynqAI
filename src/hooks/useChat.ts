
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  session_id: string;
  timestamp: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  rating?: number;
  feedback?: string;
  metadata: Record<string, any>;
}

export const useChat = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load chat sessions (excluding archived ones by default)
  const loadSessions = async (includeArchived = false) => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('chat_sessions')
        .select('id, title, created_at, updated_at, is_archived, rating, feedback, metadata')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform the data to match our ChatSession interface
      const transformedSessions: ChatSession[] = (data || []).map(session => ({
        id: session.id,
        title: session.title,
        created_at: session.created_at,
        updated_at: session.updated_at,
        is_archived: session.is_archived || false,
        rating: session.rating || undefined,
        feedback: session.feedback || undefined,
        metadata: session.metadata || {}
      }));
      
      setSessions(transformedSessions);
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
      
      // Transform the data to match our Message interface
      const transformedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender as 'user' | 'bot',
        session_id: msg.session_id,
        timestamp: msg.timestamp || msg.created_at,
        created_at: msg.created_at
      }));
      
      setCurrentMessages(transformedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Create new session
  const createSession = async (title: string = 'New Chat', metadata: Record<string, any> = {}) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert([{
          user_id: user.id,
          title,
          metadata,
          is_archived: false,
        }])
        .select('id, title, created_at, updated_at, is_archived, rating, feedback, metadata')
        .single();

      if (error) throw error;
      await loadSessions();
      return {
        id: data.id,
        title: data.title,
        created_at: data.created_at,
        updated_at: data.updated_at,
        is_archived: data.is_archived || false,
        rating: data.rating || undefined,
        feedback: data.feedback || undefined,
        metadata: data.metadata || {}
      };
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };

  // Add message to session
  const addMessage = async (sessionId: string, content: string, sender: 'user' | 'bot') => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          session_id: sessionId,
          content,
          sender,
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

  // Archive session
  const archiveSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ is_archived: true })
        .eq('id', sessionId);

      if (error) throw error;
      await loadSessions();
      
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setCurrentMessages([]);
      }
    } catch (error) {
      console.error('Error archiving session:', error);
    }
  };

  // Rate session
  const rateSession = async (sessionId: string, rating: number, feedback?: string) => {
    try {
      const updates: any = { rating };
      if (feedback) updates.feedback = feedback;

      const { error } = await supabase
        .from('chat_sessions')
        .update(updates)
        .eq('id', sessionId);

      if (error) throw error;
      await loadSessions();
    } catch (error) {
      console.error('Error rating session:', error);
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
