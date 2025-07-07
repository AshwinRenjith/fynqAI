
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chat';

export const chatMessageService = {
  // Load messages for a session
  async loadMessages(sessionId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Transform the data to match our Message interface
      return (data || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: (msg as any).sender || (msg.is_user ? 'user' : 'bot') as 'user' | 'bot',
        session_id: msg.session_id,
        timestamp: (msg as any).timestamp || msg.created_at,
        created_at: msg.created_at
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  },

  // Add message to session
  async addMessage(sessionId: string, content: string, sender: 'user' | 'bot'): Promise<any> {
    try {
      const messageData: any = {
        session_id: sessionId,
        content,
        is_user: sender === 'user',
      };

      // Add sender field if it exists in the schema
      if ((sender === 'user' || sender === 'bot')) {
        messageData.sender = sender;
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert([messageData])
        .select()
        .single();

      if (error) throw error;
      
      // Update session timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      return data;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }
};
