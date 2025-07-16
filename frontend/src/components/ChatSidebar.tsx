
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Plus, Trash2, X, Crown, Archive, Star, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useChat } from '@/hooks/useChat';
import { useNavigate } from 'react-router-dom';

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
  const { sessions, deleteSession, archiveSession, rateSession } = useChat();
  const navigate = useNavigate();
  const [showArchived, setShowArchived] = useState(false);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleUpgradeClick = () => {
    navigate('/premium');
  };

  const handleRateSession = async (sessionId: string, rating: number) => {
    await rateSession(sessionId, rating);
  };

  const filteredSessions = sessions.filter(session => 
    showArchived ? session.is_archived : !session.is_archived
  );

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
          {/* Header */}
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
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl mb-3"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className="w-full text-xs"
            >
              {showArchived ? 'Show Active' : 'Show Archived'}
            </Button>
          </div>

          {/* Chat Sessions */}
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-2">
              {filteredSessions.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">
                    {showArchived ? 'No archived sessions' : 'No chat sessions yet'}
                  </p>
                  <p className="text-xs">
                    {showArchived ? 'Archive sessions to see them here' : 'Start a new chat to begin!'}
                  </p>
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "group flex items-start p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-white/30 relative",
                      activeSessionId === session.id ? "bg-white/40 border border-purple-200" : "hover:shadow-lg"
                    )}
                  >
                    <div 
                      className="flex-1 min-w-0 mr-2"
                      onClick={() => onSessionSelect(session.id)}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <MessageCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        {session.rating && (
                          <div className="flex items-center">
                            {[...Array(session.rating)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-800 truncate text-sm">
                        {session.title}
                      </h3>
                      <span className="text-xs text-gray-500 mt-1 block">
                        {formatTime(session.created_at)}
                      </span>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                        >
                          <MoreVertical className="w-3 h-3 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!session.is_archived && (
                          <>
                            <DropdownMenuItem onClick={() => handleRateSession(session.id, 5)}>
                              <Star className="w-3 h-3 mr-2" />
                              Rate 5 stars
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRateSession(session.id, 4)}>
                              <Star className="w-3 h-3 mr-2" />
                              Rate 4 stars
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => archiveSession(session.id)}>
                              <Archive className="w-3 h-3 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem 
                          onClick={() => deleteSession(session.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Premium Button at bottom */}
          <div className="p-4 border-t border-white/20">
            <Button
              onClick={handleUpgradeClick}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white border-0 rounded-xl px-4 py-3 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <Crown className="w-4 h-4 mr-2" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">Upgrade to Premium</span>
                <span className="text-xs opacity-90">Unlock unlimited features</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatSidebar;
