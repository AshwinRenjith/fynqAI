
import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChat } from '@/hooks/useChat';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onToggle,
  activeSessionId,
  onSessionSelect,
  onNewSession
}) => {
  const { sessions, deleteSession } = useChat();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-20 h-[calc(100vh-5rem)] w-80 bg-white/95 backdrop-blur-xl border-r border-white/30 shadow-2xl z-50 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header with close button */}
          <div className="p-4 border-b border-white/20">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800">Chat History</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="text-gray-500 hover:text-gray-700 hover:bg-white/30 rounded-xl p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={onNewSession}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Chat Sessions */}
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-2">
              {sessions.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No chat sessions yet</p>
                  <p className="text-xs">Start a new chat to begin!</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => onSessionSelect(session.id)}
                    className={cn(
                      "group flex items-start p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-white/30",
                      activeSessionId === session.id ? "bg-white/40 border border-purple-200" : "hover:shadow-lg"
                    )}
                  >
                    <MessageCircle className="w-4 h-4 mt-1 mr-3 text-purple-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 truncate text-sm">
                        {session.title}
                      </h3>
                      <span className="text-xs text-gray-500 mt-1 block">
                        {formatTime(session.created_at)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
};

export default ChatSidebar;
