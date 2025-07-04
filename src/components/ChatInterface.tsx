
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Send, Paperclip, Sparkles, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { sendMessageToGemini } from '@/lib/api';
import { FileManager } from '@/components/FileManager';

interface ChatInterfaceProps {
  currentSessionId: string | null;
  hasMessages: boolean;
}

interface Message {
  id: string;
  content: string;
  is_user: boolean;
  created_at: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentSessionId, hasMessages }) => {
  const { user } = useAuth();
  const { currentMessages, addMessage, startNewChat } = useChat();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFileManager, setShowFileManager] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const messageContent = input.trim();
    setInput('');
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
      await addMessage(sessionId, messageContent, true);

      // Send to backend API
      const response = await sendMessageToGemini(messageContent, undefined, () => {
        toast({
          title: "Authentication required",
          description: "Please sign in to chat with AI tutor",
          variant: "destructive",
        });
      });

      // Add AI response
      if (response && response.response) {
        await addMessage(sessionId, response.response, false);
      } else {
        throw new Error('No response from AI');
      }

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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {currentMessages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Ready to learn something new?
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Ask me anything about your studies, homework, or any topic you'd like to explore. I'm here to help you understand and learn!
              </p>
            </div>
          ) : (
            currentMessages.map((message: Message) => (
              <div key={message.id} className={`flex ${message.is_user ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-3 max-w-3xl ${message.is_user ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                    message.is_user 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500'
                  }`}>
                    {message.is_user ? (
                      <User className="h-5 w-5 text-white" />
                    ) : (
                      <Sparkles className="h-5 w-5 text-white" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className="relative group">
                    <div className={`
                      backdrop-blur-xl border border-white/30 rounded-3xl px-6 py-4 shadow-xl transition-all duration-300 hover:shadow-2xl
                      ${message.is_user 
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30' 
                        : 'bg-white/70 hover:bg-white/80'
                      }
                    `}>
                      <p className={`text-sm leading-relaxed ${
                        message.is_user ? 'text-gray-800' : 'text-gray-700'
                      }`}>
                        {message.content}
                      </p>
                      
                      <div className={`text-xs mt-2 opacity-60 ${
                        message.is_user ? 'text-gray-600' : 'text-gray-500'
                      }`}>
                        {formatTime(message.created_at)}
                      </div>
                    </div>

                    {/* Message indicator */}
                    <div className={`absolute top-4 ${
                      message.is_user ? '-left-1' : '-right-1'
                    } w-2 h-2 bg-gradient-to-r ${
                      message.is_user 
                        ? 'from-blue-500 to-purple-500' 
                        : 'from-purple-500 to-pink-500'
                    } rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-3xl">
                <div className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-r from-purple-500 to-pink-500">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="backdrop-blur-xl border border-white/30 rounded-3xl px-6 py-4 shadow-xl bg-white/70">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-white/30 bg-white/20 backdrop-blur-xl p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <Card className="bg-white/80 backdrop-blur-xl border-white/50 shadow-2xl">
              <div className="flex items-end space-x-3 p-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFileManager(true)}
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl p-2"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                
                <div className="flex-1">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything about your studies..."
                    className="min-h-[60px] max-h-32 resize-none border-0 bg-transparent focus:ring-0 focus:outline-none text-gray-800 placeholder:text-gray-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    disabled={isLoading}
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </Card>
          </form>
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
