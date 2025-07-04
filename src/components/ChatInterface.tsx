import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { sendMessageToGemini } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { FileManager } from '@/components/FileManager';
import { Send, AlertCircle, Image, FileText, Paperclip, FolderOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  currentSessionId: string | null;
  hasMessages: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentSessionId, hasMessages }) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFileManager, setShowFileManager] = useState(false);
  const { user } = useAuth();
  const { currentMessages, addMessage } = useChat();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Expand/contract input based on interaction
  useEffect(() => {
    setIsExpanded(hasMessages || message.length > 0 || selectedFile !== null);
  }, [hasMessages, message, selectedFile]);

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedFile) {
      toast({
        title: "Please enter a message or attach a file",
        description: "Type a question or attach an image/document to send to the AI tutor.",
        variant: "destructive",
      });
      return;
    }

    if (!user || !currentSessionId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to chat with the AI tutor.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Add user message to database
      await addMessage(currentSessionId, message, true);

      // Send to AI and get response
      const result = await sendMessageToGemini(message, undefined, () => {
        toast({
          title: "Authentication Error",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
      });

      // Add AI response to database
      await addMessage(currentSessionId, result.response, false);

      setMessage('');
      setSelectedFile(null);
      
      toast({
        title: "Message sent! 🎉",
        description: "AI tutor has responded to your question.",
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage = error.message || 'Failed to send message';
      setError(errorMessage);
      
      toast({
        title: "Error sending message",
        description: errorMessage,
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      toast({
        title: "Image attached",
        description: `${file.name} is ready to be sent.`,
      });
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image file.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
        toast({
          title: "Document attached",
          description: `${file.name} is ready to be processed.`,
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF, DOC, DOCX, or TXT file.",
          variant: "destructive",
        });
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {error && (
            <div className="p-4 bg-red-100 border border-red-300 rounded-2xl flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Connection Error</p>
                <p className="text-sm">{error}</p>
                <p className="text-xs mt-1">Make sure the backend server is running on http://localhost:8000</p>
              </div>
            </div>
          )}

          {currentMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex w-full",
                msg.is_user ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] p-4 rounded-2xl shadow-lg",
                  msg.is_user
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    : "bg-white/90 backdrop-blur-xl border border-white/30 text-gray-800"
                )}
              >
                {msg.is_user ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="prose prose-gray max-w-none prose-sm">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input Area */}
      <div 
        className={cn(
          "p-4 bg-white/10 backdrop-blur-xl border-t border-white/20 transition-all duration-300",
          isExpanded ? "pb-6" : "pb-4"
        )}
      >
        <div className="max-w-4xl mx-auto">
          {/* File Attachment Preview */}
          {selectedFile && (
            <div className="mb-4 p-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedFile.type.startsWith('image/') ? (
                  <Image className="h-4 w-4 text-purple-500" />
                ) : (
                  <FileText className="h-4 w-4 text-blue-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-800">{selectedFile.name}</p>
                  <p className="text-xs text-gray-600">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </Button>
            </div>
          )}

          {/* Input Area */}
          <div 
            className={cn(
              "bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-3 shadow-lg transition-all duration-300",
              isExpanded ? "scale-100" : "scale-95"
            )}
          >
            <div className="flex items-end space-x-3">
              {/* Attachment Buttons */}
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  className="text-purple-500 hover:text-purple-700 hover:bg-purple-100/50 rounded-xl p-2"
                  disabled={isLoading}
                >
                  <Image className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-100/50 rounded-xl p-2"
                  disabled={isLoading}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFileManager(true)}
                  className="text-green-500 hover:text-green-700 hover:bg-green-100/50 rounded-xl p-2"
                  disabled={isLoading}
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>

              {/* Text Input */}
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setIsExpanded(true)}
                placeholder="Ask me anything about your studies..."
                disabled={isLoading}
                className="flex-1 bg-white/50 backdrop-blur-sm border-0 rounded-2xl px-4 py-2 focus:ring-2 focus:ring-purple-300 resize-none"
              />

              {/* Send Button */}
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || (!message.trim() && !selectedFile)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl px-4 py-2 transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* File Manager Modal */}
      <FileManager
        isOpen={showFileManager}
        onClose={() => setShowFileManager(false)}
        onFileSelect={(file) => {
          toast({
            title: "File selected",
            description: `${file.file_name} will be used for context.`,
          });
          setShowFileManager(false);
        }}
      />
    </div>
  );
};

export default ChatInterface;