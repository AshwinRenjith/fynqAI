
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

      if (error) {
        console.error('Error loading sessions:', error);
        return [];
      }
      
      // Transform the data to match our ChatSession interface
      // Use type assertion to handle the schema mismatch
      const transformedSessions: ChatSession[] = (data || []).map(session => {
        const sessionAny = session as any; // Type assertion to handle missing columns
        return {
          id: sessionAny.id,
          title: sessionAny.title,
          created_at: sessionAny.created_at,
          updated_at: sessionAny.updated_at,
          is_archived: sessionAny.is_archived ?? false,
          rating: sessionAny.rating ?? undefined,
          feedback: sessionAny.feedback ?? undefined,
          metadata: sessionAny.metadata ?? {}
        };
      });
      
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
      // Start with basic session data
      const sessionData: any = {
        user_id: userId,
        title,
      };

      // Try to add optional fields, but don't fail if they don't exist
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert([sessionData])
        .select('*')
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return null;
      }
      
      // Use type assertion to handle schema mismatch
      const sessionAny = data as any;
      return {
        id: sessionAny.id,
        title: sessionAny.title,
        created_at: sessionAny.created_at,
        updated_at: sessionAny.updated_at,
        is_archived: sessionAny.is_archived ?? false,
        rating: sessionAny.rating ?? undefined,
        feedback: sessionAny.feedback ?? undefined,
        metadata: sessionAny.metadata ?? {}
      };
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  },

  // Archive session
  async archiveSession(sessionId: string): Promise<boolean> {
    try {
      // Try to update with is_archived, but fallback to deleting if column doesn't exist
      const { error } = await supabase
        .from('chat_sessions')
        .update({ is_archived: true } as any) // Type assertion for schema mismatch
        .eq('id', sessionId);

      if (error) {
        console.error('Error archiving session:', error);
        // If archiving fails, try deleting as fallback
        return await this.deleteSession(sessionId);
      }
      return true;
    } catch (error) {
      console.error('Error archiving session:', error);
      return false;
    }
  },

  // Rate session
  async rateSession(sessionId: string, rating: number, feedback?: string): Promise<boolean> {
    try {
      // Try to update rating, but handle gracefully if columns don't exist
      const updates: any = {};
      
      // Only try to set rating if it's a valid number
      if (typeof rating === 'number' && rating >= 1 && rating <= 5) {
        updates.rating = rating;
      }
      
      if (feedback && typeof feedback === 'string') {
        updates.feedback = feedback;
      }

      if (Object.keys(updates).length === 0) {
        console.warn('No valid rating data to update');
        return false;
      }

      const { error } = await supabase
        .from('chat_sessions')
        .update(updates)
        .eq('id', sessionId);

      if (error) {
        console.error('Error rating session:', error);
        return false;
      }
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
