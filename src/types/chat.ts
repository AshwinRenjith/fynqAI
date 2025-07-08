export interface Message {
  id: string;
  content: string;
  session_id: string;
  created_at: string;
  // sender is mapped from is_user: true => 'user', false => 'bot'
  sender: 'user' | 'bot';
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  // No is_archived, rating, feedback, metadata in DB
}
