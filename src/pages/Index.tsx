
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Navbar } from '@/components/Navbar';
import FileUploadModal from '@/components/FileUploadModal';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { sendMessageToGemini, uploadImageToGemini, getChatHistory } from '@/lib/api';
import { Send, Upload, Image, BookOpen, Sparkles, MessageSquare, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Load chat history on component mount
  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [user]);

  const loadChatHistory = async () => {
    try {
      const history = await getChatHistory(() => navigate('/auth'));
      if (history && history.length > 0) {
        // Load the most recent chat
        const latestChat = history[0];
        setCurrentChatId(latestChat.chat_id);
        const formattedMessages = latestChat.messages.map((msg: any, index: number) => ({
          id: `${msg.timestamp}-${index}`,
          sender: msg.sender as 'user' | 'ai',
          content: msg.content,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      // Don't show error toast for history loading failure
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: selectedImage ? `[Image] ${inputMessage}` : inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      let response;
      
      if (selectedImage) {
        response = await uploadImageToGemini(
          selectedImage, 
          inputMessage,
          currentChatId || undefined,
          () => navigate('/auth')
        );
        setSelectedImage(null);
      } else {
        response = await sendMessageToGemini(
          inputMessage,
          currentChatId || undefined,
          () => navigate('/auth')
        );
      }

      if (response && response.response) {
        setCurrentChatId(response.chat_id);
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          content: response.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedImage(file);
      toast({
        title: "Image selected! 📸",
        description: "Your image is ready to be sent with your message.",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (redirect is handling this)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="pt-24 pb-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-3xl shadow-lg">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            Your AI <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Learning</span> Companion
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Get personalized tutoring, upload your study materials, and learn with AI-powered assistance
          </p>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <Card className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-2xl">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">AI Tutor Chat</h2>
                  <p className="text-sm text-gray-600">Ask questions, get explanations, upload materials</p>
                </div>
              </div>
              <Button
                onClick={() => setIsFileModalOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl px-4 py-2 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Upload Materials
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <CardContent className="p-0">
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-4 rounded-3xl inline-block mb-4">
                    <Bot className="h-12 w-12 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Start a conversation</h3>
                  <p className="text-gray-500">Ask me anything about your studies, upload images, or get help with homework!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`p-2 rounded-2xl ${message.sender === 'user' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-100'}`}>
                        {message.sender === 'user' ? (
                          <User className="h-4 w-4 text-white" />
                        ) : (
                          <Bot className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div className={`px-4 py-3 rounded-2xl ${message.sender === 'user' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-white border border-gray-200'}`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-purple-100' : 'text-gray-500'}`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <div className="p-2 rounded-2xl bg-gray-100">
                      <Bot className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-white border border-gray-200">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-white/20 bg-white/10">
              {selectedImage && (
                <div className="mb-4 p-3 bg-blue-50 rounded-2xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Image className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-blue-700">Image selected: {selectedImage.name}</span>
                    </div>
                    <Button
                      onClick={() => setSelectedImage(null)}
                      variant="ghost"
                      size="sm"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/20 hover:bg-white/30 text-gray-700 border border-white/30 rounded-2xl p-3 transition-all duration-300 hover:scale-105"
                >
                  <Upload className="h-5 w-5" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about your studies..."
                    className="bg-white/50 backdrop-blur-sm border border-white/30 rounded-2xl pr-12 py-3 focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || (!inputMessage.trim() && !selectedImage)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl px-6 py-3 transition-all duration-300 hover:scale-105 shadow-lg disabled:hover:scale-100"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <FileUploadModal 
        isOpen={isFileModalOpen} 
        onClose={() => setIsFileModalOpen(false)} 
      />
    </div>
  );
};

export default Index;
