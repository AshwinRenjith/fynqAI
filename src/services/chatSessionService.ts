
import { supabase } from '@/integrations/supabase/client';
import { ChatSession } from '@/types/chat';

export const chatSessionService = {
  // Load chat sessions (excluding archived ones by default)
  async loadSessions(userId: string, includeArchived = false): Promise<ChatSession[]> {
    try {
      let query = supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform the data to match our ChatSession interface
      const transformedSessions: ChatSession[] = (data || []).map(session => ({
        id: session.id,
        title: session.title,
        created_at: session.created_at,
        updated_at: session.updated_at,
        is_archived: (session as any).is_archived || false,
        rating: (session as any).rating || undefined,
        feedback: (session as any).feedback || undefined,
        metadata: (session as any).metadata || {}
      }));
      
      // Filter archived sessions if needed
      return includeArchived 
        ? transformedSessions 
        : transformedSessions.filter(s => !s.is_archived);
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  },

  // Create new session
  async createSession(userId: string, title: string = 'New Chat', metadata: Record<string, any> = {}): Promise<ChatSession | null> {
    try {
      const sessionData: any = {
        user_id: userId,
        title,
      };

      // Only add metadata if the column exists
      if (metadata && Object.keys(metadata).length > 0) {
        sessionData.metadata = metadata;
      }

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert([sessionData])
        .select('*')
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        title: data.title,
        created_at: data.created_at,
        updated_at: data.updated_at,
        is_archived: (data as any).is_archived || false,
        rating: (data as any).rating || undefined,
        feedback: (data as any).feedback || undefined,
        metadata: (data as any).metadata || {}
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
        .update({ is_archived: true } as any)
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error archiving session:', error);
      return false;
    }
  },

  // Rate session
  async rateSession(sessionId: string, rating: number, feedback?: string): Promise<boolean> {
    try {
      const updates: any = { rating };
      if (feedback) updates.feedback = feedback;

      const { error } = await supabase
        .from('chat_sessions')
        .update(updates)
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error rating session:', error);
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

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }
};
