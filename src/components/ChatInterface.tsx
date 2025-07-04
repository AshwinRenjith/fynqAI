
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { sendMessageToGemini } from '@/lib/api';
import { FileManager } from '@/components/FileManager';
import { toast } from '@/hooks/use-toast';

interface ChatInterfaceProps {
  currentSessionId: string | null;
  hasMessages: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentSessionId, hasMessages }) => {
  const { user } = useAuth();
  const { currentMessages, addMessage, startNewChat } = useChat();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFileManager, setShowFileManager] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || !user) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    try {
      // Ensure we have a session
      let sessionId = currentSessionId;
      if (!sessionId) {
        const newSession = await startNewChat();
        sessionId = newSession?.id || null;
      }

      if (!sessionId) {
        toast({
          title: "Error",
          description: "Failed to create chat session. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Add user message to database
      await addMessage(sessionId, userMessage, true);

      // Try to get AI response from backend
      let aiResponse = '';
      try {
        const response = await sendMessageToGemini(userMessage);
        aiResponse = response.response || 'I apologize, but I received an empty response. Could you please rephrase your question?';
      } catch (apiError) {
        console.error('Backend API error:', apiError);
        
        // Fallback response when backend is not available
        aiResponse = generateFallbackResponse(userMessage);
        
        toast({
          title: "Backend Unavailable",
          description: "Using offline mode. Please start your backend server for full AI functionality.",
          variant: "destructive",
        });
      }

      // Add AI response to database
      await addMessage(sessionId, aiResponse, false);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('math') || lowerMessage.includes('equation') || lowerMessage.includes('solve')) {
      return "I'd be happy to help you with math! However, I'm currently running in offline mode. To get detailed mathematical solutions and step-by-step explanations, please start your backend server. In the meantime, I can suggest breaking down complex problems into smaller steps and using online calculators for verification.";
    }
    
    if (lowerMessage.includes('science') || lowerMessage.includes('chemistry') || lowerMessage.includes('physics')) {
      return "Science questions are fascinating! I'm currently in offline mode, so I can't provide detailed scientific explanations right now. Please start your backend server for comprehensive science tutoring. For now, I recommend consulting your textbook or reliable online resources.";
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('study')) {
      return "I'm here to help with your studies! Currently running in offline mode - please start your backend server (FastAPI on port 8000) for full AI tutoring capabilities. Once connected, I can provide detailed explanations, solve problems step-by-step, and adapt to your learning style.";
    }
    
    return "Hello! I'm your AI tutor, but I'm currently running in offline mode. To unlock my full potential for personalized learning, detailed explanations, and interactive problem-solving, please start your backend server. Once connected, I'll be able to provide comprehensive educational support tailored to your needs!";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to chat with your AI tutor.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentMessages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl text-white">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Ready to Learn!</h3>
              <p className="text-gray-600 max-w-md">
                Ask me anything about math, science, or any subject you're studying. 
                I'm here to help you understand and learn!
              </p>
            </div>
          </div>
        ) : (
          currentMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.is_user ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-4 rounded-2xl ${
                  msg.is_user
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <span className="text-xs opacity-70 mt-2 block">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                <span className="text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFileManager(true)}
            className="mb-2"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your studies..."
              className="min-h-[60px] max-h-32 resize-none border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              disabled={isLoading}
            />
          </div>
          
          <Button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 mb-2"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* File Manager Modal */}
      <FileManager
        isOpen={showFileManager}
        onClose={() => setShowFileManager(false)}
      />
    </div>
  );
};

export default ChatInterface;
