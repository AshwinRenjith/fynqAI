
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { sendMessageToGemini } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Send, AlertCircle, Image, FileText, Paperclip } from 'lucide-react';

const ChatInterface = () => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { user } = useAuth();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedFile) {
      toast({
        title: "Please enter a message or attach a file",
        description: "Type a question or attach an image/document to send to the AI tutor.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
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
      console.log('Sending message:', message);
      const result = await sendMessageToGemini(message, undefined, () => {
        toast({
          title: "Authentication Error",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
      });

      console.log('Received response:', result);
      setResponse(result.response);
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
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
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

        {response && (
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-lg">
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{response}</p>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input Area */}
      <div className="p-6 bg-white/10 backdrop-blur-xl border-t border-white/20">
        <div className="max-w-4xl mx-auto">
          {/* File Attachment Preview */}
          {selectedFile && (
            <div className="mb-4 p-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedFile.type.startsWith('image/') ? (
                  <Image className="h-5 w-5 text-purple-500" />
                ) : (
                  <FileText className="h-5 w-5 text-blue-500" />
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
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-4 shadow-lg">
            <div className="flex items-end space-x-3">
              {/* Attachment Buttons */}
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  className="text-purple-500 hover:text-purple-700 hover:bg-purple-100/50 rounded-xl"
                  disabled={isLoading}
                >
                  <Image className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-100/50 rounded-xl"
                  disabled={isLoading}
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
              </div>

              {/* Text Input */}
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your studies..."
                disabled={isLoading}
                className="flex-1 bg-white/50 backdrop-blur-sm border-0 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-purple-300 resize-none min-h-[44px]"
              />

              {/* Send Button */}
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || (!message.trim() && !selectedFile)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl px-6 py-3 transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-5 w-5" />
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
    </div>
  );
};

export default ChatInterface;
