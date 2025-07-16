import { supabase } from '@/integrations/supabase/client';
import { ChatSession } from '@/types/chat';

export const chatSessionService = {
  // Load chat sessions
  async loadSessions(userId: string, includeArchived: boolean = false): Promise<ChatSession[]> {
    try {
      let query = supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      const { data, error } = await query;
      if (error) {
        console.error('Error loading sessions:', error);
        return [];
      }
      // Map DB fields to ChatSession type
      let sessions = (data || []).map(session => {
        const s: any = session;
        return {
          id: s.id,
          title: s.title,
          created_at: s.created_at,
          updated_at: s.updated_at,
          is_archived: !!s.is_archived,
        };
      });
      if (!includeArchived) {
        sessions = sessions.filter(s => !s.is_archived);
      }
      return sessions;
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  },

  // Create new session
  async createSession(userId: string, title: string = 'New Chat'): Promise<ChatSession | null> {
    try {
      const sessionData = {
        user_id: userId,
        title,
      };
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert([sessionData])
        .select('*')
        .single();
      if (error) {
        console.error('Error creating session:', error);
        return null;
      }
      const s: any = data;
      return {
        id: s.id,
        title: s.title,
        created_at: s.created_at,
        updated_at: s.updated_at,
        is_archived: !!s.is_archived,
      };
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  },

  // Archive session
  async archiveSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ is_archived: true })
        .eq('id', sessionId);
      if (error) {
        console.error('Error archiving session:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error archiving session:', error);
      return false;
    }
  },

  // Delete session
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);
      if (error) {
        console.error('Error deleting session:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }
};
