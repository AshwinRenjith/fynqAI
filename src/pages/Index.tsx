
import React, { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Upload,
  Sparkles,
  MessageSquare,
  BookOpen,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { sendMessageToGemini, uploadImageToGemini, getChatHistory } from '@/lib/api';
import FileUploadModal from '@/components/FileUploadModal';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  image?: string;
}

interface ChatHistory {
  chat_id: number;
  title: string;
  created_at: string;
  messages: Array<{
    sender: string;
    content: string;
    timestamp: string;
  }>;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<number | undefined>(undefined);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not authenticated
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

  useEffect(() => {
    if (!loading && user) {
      loadChatHistory();
    }
  }, [loading, user]);

  if (!user || loading) return;

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const history = await getChatHistory(() => navigate('/auth'));
      setChatHistory(history);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const handleAuthError = () => {
    toast({
      title: "Authentication required",
      description: "Please sign in to continue",
      variant: "destructive",
    });
    navigate('/auth');
  };

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && !selectedImage) || isLoading) return;

    const messageText = inputMessage.trim() || 'Analyze this image';
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      image: imagePreview || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      let response;

      if (selectedImage) {
        response = await uploadImageToGemini(selectedImage, messageText, currentChatId, handleAuthError);
      } else {
        response = await sendMessageToGemini(messageText, currentChatId, handleAuthError);
      }

      if (response && response.response) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.response,
          sender: 'ai',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiMessage]);

        // Update current chat ID if this is a new chat
        if (response.chat_id && !currentChatId) {
          setCurrentChatId(response.chat_id);
        }

        // Reload chat history to show the new chat
        await loadChatHistory();
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      clearImageSelection();
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImageSelection = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(undefined);
  };

  const loadChat = (chat: ChatHistory) => {
    const loadedMessages: Message[] = chat.messages.map((msg, index) => ({
      id: `${chat.chat_id}-${index}`,
      text: msg.content.replace(/^\[Image\] /, ''),
      sender: msg.sender as 'user' | 'ai',
      timestamp: new Date(msg.timestamp),
      image: msg.content.startsWith('[Image]') ? undefined : undefined, // Image data not preserved in history
    }));

    setMessages(loadedMessages);
    setCurrentChatId(chat.chat_id);
  };

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <span className="text-lg text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />

      {/* Main Content */}
      <div className="pt-20 px-4 pb-4 max-w-7xl mx-auto">
        <div className="flex gap-6 h-[calc(100vh-6rem)]">
          {/* Sidebar */}
          <div className="w-80 bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Chat History</h2>
              <Button
                onClick={startNewChat}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl px-4 py-2 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {chatHistory.map((chat) => (
                <div
                  key={chat.chat_id}
                  onClick={() => loadChat(chat)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 ${currentChatId === chat.chat_id
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200'
                      : 'bg-white/50 hover:bg-white/70 border border-white/30'
                    }`}
                >
                  <h3 className="font-semibold text-gray-800 truncate">{chat.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(chat.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {chat.messages.length} messages
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/20">
              <Button
                onClick={() => setIsFileUploadModalOpen(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl px-4 py-3 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Upload Learning Materials
              </Button>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl flex flex-col">
            {/* Chat Header */}
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-2xl">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">fynqAI Tutor</h1>
                  <p className="text-gray-600">Your personalized AI learning companion</p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-3xl inline-block mb-4">
                    <Sparkles className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Welcome to fynqAI!
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Start a conversation with your AI tutor. Ask questions, upload images, or share your learning materials.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="bg-white/50 p-4 rounded-2xl">
                      <MessageSquare className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-800">Ask Questions</p>
                      <p className="text-xs text-gray-600 mt-1">Get help with any topic</p>
                    </div>
                    <div className="bg-white/50 p-4 rounded-2xl">
                      <ImageIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-800">Upload Images</p>
                      <p className="text-xs text-gray-600 mt-1">Analyze diagrams & photos</p>
                    </div>
                    <div className="bg-white/50 p-4 rounded-2xl">
                      <BookOpen className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-800">Study Materials</p>
                      <p className="text-xs text-gray-600 mt-1">Upload your textbooks</p>
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${message.sender === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-white/70 text-gray-800 border border-white/30'
                        }`}
                    >
                      {message.image && (
                        <img
                          src={message.image}
                          alt="Uploaded"
                          className="w-full h-auto rounded-xl mb-2"
                        />
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                        }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/70 border border-white/30 px-4 py-3 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                      <span className="text-sm text-gray-600">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-white/20">
              {imagePreview && (
                <div className="mb-4 relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-32 rounded-xl border border-white/30"
                  />
                  <Button
                    onClick={clearImageSelection}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 w-6 h-6"
                  >
                    ×
                  </Button>
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
                  className="bg-white/50 hover:bg-white/70 text-gray-700 border border-white/30 rounded-2xl p-3 transition-all duration-300 hover:scale-105"
                >
                  <Upload className="h-5 w-5" />
                </Button>

                <div className="flex-1 relative">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask me anything..."
                    className="w-full bg-white/50 border border-white/30 rounded-2xl px-4 py-3 pr-12 resize-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                    rows={1}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={(!inputMessage.trim() && !selectedImage) || isLoading}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-2xl px-6 py-3 transition-all duration-300 hover:scale-105 shadow-lg disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FileUploadModal
        isOpen={isFileUploadModalOpen}
        onClose={() => setIsFileUploadModalOpen(false)}
      />
    </div>
  );
};

export default Index;
