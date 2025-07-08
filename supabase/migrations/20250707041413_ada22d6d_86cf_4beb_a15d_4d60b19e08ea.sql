
-- Add missing columns to chat_sessions table
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS feedback TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Update the messages table to use 'sender' field with proper check constraint
-- First, add the new column
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS sender TEXT CHECK (sender IN ('user', 'bot'));

-- Update existing data to use the new sender field based on is_user
UPDATE public.messages 
SET sender = CASE 
  WHEN is_user = true THEN 'user' 
  ELSE 'bot' 
END
WHERE sender IS NULL;

-- Make sender column required
ALTER TABLE public.messages 
ALTER COLUMN sender SET NOT NULL;

-- Add timestamp column (rename created_at for consistency)
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing records
UPDATE public.messages 
SET timestamp = created_at 
WHERE timestamp IS NULL;

-- Add session title auto-generation function
CREATE OR REPLACE FUNCTION public.generate_session_title_from_first_message()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update session title with first 50 characters of first user message
  IF NEW.sender = 'user' AND NOT EXISTS (
    SELECT 1 FROM public.messages 
    WHERE session_id = NEW.session_id 
    AND sender = 'user' 
    AND id != NEW.id
  ) THEN
    UPDATE public.chat_sessions 
    SET title = CASE 
      WHEN LENGTH(NEW.content) > 50 
      THEN LEFT(NEW.content, 47) || '...'
      ELSE NEW.content
    END
    WHERE id = NEW.session_id AND title = 'New Chat';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate session titles
DROP TRIGGER IF EXISTS generate_session_title ON public.messages;
CREATE TRIGGER generate_session_title
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_session_title_from_first_message();
