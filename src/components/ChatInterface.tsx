import React, { useState, useRef, useEffect, RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { sendMessageToGemini, uploadImageToGemini } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import AIMessageRenderer from './AIMessageRenderer';

interface ChatInterfaceProps {
  currentSessionId: string | null;
  hasMessages: boolean;
  onSendMessage: (msg: { sender: string; text: string; timestamp: string; sessionId: string }) => Promise<void>;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentSessionId, hasMessages, onSendMessage }) => {
  const { user } = useAuth();
  const { currentMessages, addMessage, startNewChat } = useChat();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastAIMessageRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when new messages arrive, but only if needed
  useEffect(() => {
    if (scrollAreaRef.current && lastAIMessageRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      const lastAIMessage = lastAIMessageRef.current;
      if (scrollContainer && lastAIMessage) {
        const containerRect = (scrollContainer as HTMLElement).getBoundingClientRect();
        const messageRect = lastAIMessage.getBoundingClientRect();
        // If the last AI message is not fully visible, scroll it into view
        if (messageRect.bottom > containerRect.bottom || messageRect.top < containerRect.top) {
          lastAIMessage.scrollIntoView();
        }
      }
    }
  }, [currentMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;

    let sessionId = currentSessionId;
    
    // Create new session if none exists
    if (!sessionId) {
      const newSession = await startNewChat();
      if (!newSession) {
        toast({
          title: "Error",
          description: "Failed to create new chat session",
          variant: "destructive",
        });
        return;
      }
      sessionId = newSession.id;
    }

    const messageText = input.trim() || 'Image uploaded';
    setInput('');
    setIsLoading(true);

    try {
      // Add user message with sender field
      await addMessage(sessionId, messageText, 'user');

      let response;
      if (selectedImage) {
        response = await uploadImageToGemini(selectedImage, messageText);
        setSelectedImage(null);
      } else {
        response = await sendMessageToGemini(messageText);
      }

      // Add AI response with sender field
      if (response?.response) {
        await addMessage(sessionId, response.response, 'bot');
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedImage(file);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-6 pb-36">
            {currentMessages.length === 0 && !hasMessages ? (
              <div className="text-center text-gray-500 py-12">
                <p className="text-lg mb-2">Start a conversation</p>
                <p className="text-sm">Ask me anything about your studies!</p>
              </div>
            ) : (
              currentMessages.map((message, index) => {
                const isLastAI =
                  message.sender === 'bot' && index === currentMessages.length - 1;
                return (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white ml-auto'
                          : 'bg-white/70 backdrop-blur-sm border border-white/30 shadow-lg'
                      }`}
                      ref={isLastAI ? lastAIMessageRef : undefined}
                    >
                      {message.sender === 'user' ? (
                        <p className="text-white leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      ) : (
                        <AIMessageRenderer
                          content={message.content}
                          isLatest={index === currentMessages.length - 1}
                          onComplete={() => {
                            // Optional: Handle completion
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/70 backdrop-blur-sm border border-white/30 shadow-lg rounded-2xl px-6 py-4">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Preparing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-6 left-0 w-full flex justify-center pointer-events-none z-50">
        <div className="pointer-events-auto bg-white/95 shadow-[0_8px_32px_0_rgba(31,41,55,0.25)] drop-shadow-2xl rounded-full px-5 py-2 flex items-center gap-2 max-w-2xl w-full mx-5 border border-white/30">
          {selectedImage && (
            <div className="flex items-center space-x-2 bg-white/60 rounded-full px-3 py-1 border border-white/30 mr-2">
              <ImageIcon className="w-1 h-4 text-purple-600" />
              <span className="text-sm text-gray-700">{selectedImage.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedImage(null)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 px-1"
              >
                Remove
              </Button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-1 items-center gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="flex-1 min-h-[32px] max-h-[60px] resize-none bg-transparent border-none focus:ring-0 focus:outline-none px-3 py-1 rounded-full text-gray-800 placeholder-gray-500 text-base shadow-none"
              style={{ boxShadow: 'none', background: 'transparent' }}
              disabled={isLoading}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full"
              disabled={isLoading}
            >
              <Upload className="w-5 h-5" />
            </Button>
            <Button
              type="submit"
              size="icon"
              disabled={(!input.trim() && !selectedImage) || isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full p-2 transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
