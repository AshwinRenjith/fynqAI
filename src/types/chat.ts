
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
  is_archived?: boolean;
  rating?: number;
  feedback?: string;
  metadata?: Record<string, any>;
}
