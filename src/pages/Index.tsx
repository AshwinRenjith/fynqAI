
import React, { useState, useRef } from 'react';
import { Send, Upload, FileText, Image, Menu, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import ChatMessage from '@/components/ChatMessage';
import FileUploadModal from '@/components/FileUploadModal';
import Navbar from '@/components/Navbar';
import WelcomeSection from '@/components/WelcomeSection';
import { sendMessageToGemini, uploadImageToGemini, uploadFile } from '@/lib/api';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'image';
  imageUrl?: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !fileInputRef.current?.files?.length) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await sendMessageToGemini(inputMessage);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to get response from AI. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      const userMessage: Message = {
        id: Date.now().toString(),
        content: 'I uploaded an image for you to solve',
        sender: 'user',
        timestamp: new Date(),
        type: 'image',
        imageUrl
      };
      setMessages(prev => [...prev, userMessage]);
      
      setIsLoading(true);
      try {
        const response = await uploadImageToGemini(file);
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.response,
          sender: 'ai',
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, aiMessage]);
        toast({
          title: "Image uploaded successfully! 📸",
          description: "fynqAI is analyzing your problem...",
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        toast({
          title: "Error",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <Navbar />

      <div className="container mx-auto px-4 pt-32 pb-32">
        {messages.length === 0 ? (
          <WelcomeSection onStartChat={() => document.getElementById('chat-input')?.focus()} />
        ) : (
          <div className="max-w-4xl mx-auto space-y-4 mb-32">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl px-6 py-4 max-w-xs shadow-lg">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce animation-delay-200"></div>
                      <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-400 rounded-full animate-bounce animation-delay-400"></div>
                    </div>
                    <span className="text-gray-600 text-sm">fynqAI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Chat Input */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-4xl px-6">
        <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-4 shadow-2xl">
          <div className="flex items-center space-x-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-2xl h-12 w-12 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Image className="h-5 w-5" />
            </Button>

            <Button
              onClick={() => setIsFileModalOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 rounded-2xl h-12 w-12 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <FileText className="h-5 w-5" />
            </Button>

            <div className="flex-1 relative">
              <Input
                id="chat-input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your studies... 🚀"
                className="w-full bg-white/50 backdrop-blur-sm border border-white/30 rounded-2xl pl-4 pr-12 py-3 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent shadow-inner transition-all duration-300"
              />
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() && !fileInputRef.current?.files?.length}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400 text-white border-0 rounded-2xl h-12 w-12 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <FileUploadModal 
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
      />
    </div>
  );
};

export default Index;
