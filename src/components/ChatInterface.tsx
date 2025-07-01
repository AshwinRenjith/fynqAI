
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { sendMessageToGemini } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Send, AlertCircle } from 'lucide-react';

const ChatInterface = () => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: "Please enter a message",
        description: "Type a question or message to send to the AI tutor.",
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Chat with AI Tutor</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-2xl flex items-center space-x-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Connection Error</p>
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-1">Make sure the backend server is running on http://localhost:8000</p>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your studies..."
            disabled={isLoading}
            className="flex-1 bg-white/50 backdrop-blur-sm border border-white/30 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-purple-300 focus:border-transparent"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim()}
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

      {response && (
        <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">AI Tutor Response:</h3>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{response}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
