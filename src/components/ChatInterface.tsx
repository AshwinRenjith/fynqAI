
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Paperclip, Mic, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { FileManager } from './FileManager';

interface ChatInterfaceProps {
  currentSessionId: string | null;
  hasMessages: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  currentSessionId, 
  hasMessages 
}) => {
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

  const generateAIResponse = (userMessage: string): string => {
    // Simple AI response generator - you can replace this with actual AI integration later
    const responses = [
      "That's an interesting topic! Let me help you understand it better.",
      "Great question! Let's break this down step by step.",
      "I can help you with that. Here's what you need to know:",
      "Let's explore this concept together. What specific aspect would you like to focus on?",
      "That's a fundamental concept in learning. Let me explain it clearly.",
      "I understand what you're asking. Here's a comprehensive explanation:",
      "Excellent! This is a great opportunity to dive deeper into the subject.",
      "Let me provide you with a detailed explanation that will help you grasp this concept."
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    return `${randomResponse} Regarding "${userMessage}" - this is a topic that requires careful consideration. I'm here to guide you through the learning process and help you understand the key concepts. What would you like to explore further?`;
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to chat with AI tutor",
        variant: "destructive",
      });
      return;
    }

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    try {
      let sessionId = currentSessionId;
      
      // Create new session if none exists
      if (!sessionId) {
        const newSession = await startNewChat();
        sessionId = newSession?.id || null;
      }

      if (!sessionId) {
        throw new Error('Failed to create chat session');
      }

      // Add user message
      await addMessage(sessionId, userMessage, true);

      // Generate and add AI response
      const aiResponse = generateAIResponse(userMessage);
      await addMessage(sessionId, aiResponse, false);

      toast({
        title: "Message sent! 💬",
        description: "AI tutor has responded to your question.",
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50/30 via-white/50 to-purple-50/30">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {currentMessages.length === 0 && !hasMessages ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Ready to learn?
              </h3>
              <p className="text-gray-600">
                Ask me anything and let's start your learning journey!
              </p>
            </div>
          ) : (
            currentMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-4 animate-in slide-in-from-bottom-2 duration-500",
                  !msg.is_user ? "justify-start" : "justify-end"
                )}
              >
                {!msg.is_user && (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <Card className={cn(
                  "max-w-[70%] p-4 shadow-lg border-0",
                  msg.is_user 
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white" 
                    : "bg-white/80 backdrop-blur-sm"
                )}>
                  <div className="prose prose-sm max-w-none">
                    <p className={cn(
                      "mb-0 leading-relaxed",
                      msg.is_user ? "text-white" : "text-gray-800"
                    )}>
                      {msg.content}
                    </p>
                  </div>
                  <div className={cn(
                    "text-xs mt-2 opacity-70",
                    msg.is_user ? "text-blue-100" : "text-gray-500"
                  )}>
                    {formatTime(msg.created_at)}
                  </div>
                </Card>

                {msg.is_user && (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-4 justify-start animate-in slide-in-from-bottom-2 duration-500">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <Card className="bg-white/80 backdrop-blur-sm p-4 shadow-lg border-0">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-white/20 bg-white/30 backdrop-blur-xl p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFileManager(true)}
                className="h-10 w-10 p-0 bg-white/50 hover:bg-white/70 border border-white/30"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 bg-white/50 hover:bg-white/70 border border-white/30"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your studies..."
                className="min-h-[44px] max-h-32 resize-none pr-12 bg-white/70 border-white/30 focus:border-purple-300 focus:ring-purple-300/20"
                disabled={isLoading}
              />
            </div>
            
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              className="h-10 w-10 p-0 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
