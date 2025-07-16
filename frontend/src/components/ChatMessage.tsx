
import React from 'react';
import { Sparkles, User } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'image';
  imageUrl?: string;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start space-x-3 max-w-3xl ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
          isUser 
            ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
            : 'bg-gradient-to-r from-purple-500 to-pink-500'
        }`}>
          {isUser ? (
            <User className="h-5 w-5 text-white" />
          ) : (
            <Sparkles className="h-5 w-5 text-white" />
          )}
        </div>

        {/* Message Bubble */}
        <div className={`relative group ${isUser ? 'ml-0' : 'mr-0'}`}>
          <div className={`
            backdrop-blur-xl border border-white/30 rounded-3xl px-6 py-4 shadow-xl transition-all duration-300 hover:shadow-2xl
            ${isUser 
              ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30' 
              : 'bg-white/70 hover:bg-white/80'
            }
          `}>
            {message.type === 'image' && message.imageUrl && (
              <div className="mb-3">
                <img 
                  src={message.imageUrl} 
                  alt="Uploaded problem" 
                  className="max-w-sm rounded-2xl shadow-lg border border-white/30"
                />
              </div>
            )}
            
            <p className={`text-sm leading-relaxed ${
              isUser ? 'text-gray-800' : 'text-gray-700'
            }`}>
              {message.content}
            </p>
            
            <div className={`text-xs mt-2 opacity-60 ${
              isUser ? 'text-gray-600' : 'text-gray-500'
            }`}>
              {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>

          {/* Message indicator */}
          <div className={`absolute top-4 ${
            isUser ? '-left-1' : '-right-1'
          } w-2 h-2 bg-gradient-to-r ${
            isUser 
              ? 'from-blue-500 to-purple-500' 
              : 'from-purple-500 to-pink-500'
          } rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-300`}></div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
