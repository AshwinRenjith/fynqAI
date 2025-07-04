import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import ChatInterface from "@/components/ChatInterface";
import ChatSidebar from "@/components/ChatSidebar";
import { WelcomeMessage } from "@/components/WelcomeMessage";
import { Survey } from "@/components/Survey";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showSurvey, setShowSurvey] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const { 
    currentSessionId, 
    currentMessages, 
    switchToSession, 
    startNewChat 
  } = useChat();

  // Load user profile and check survey status
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      
      try {
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        setUserProfile(profile);

        // Check if user has completed survey
        const { data: survey } = await supabase
          .from('survey_responses')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!survey) {
          setShowSurvey(true);
        } else if (!currentSessionId || currentMessages.length === 0) {
          setShowWelcome(true);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    if (user && !loading) {
      loadUserProfile();
    }
  }, [user, loading, currentSessionId, currentMessages.length]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  // Show survey if not completed
  if (showSurvey) {
    return <Survey onComplete={() => setShowSurvey(false)} />;
  }

  const handleSessionSelect = async (sessionId: string) => {
    await switchToSession(sessionId);
    setSidebarOpen(false);
    setShowWelcome(false);
  };

  const handleNewSession = async () => {
    await startNewChat();
    setSidebarOpen(false);
    setShowWelcome(false);
  };

  const handleStartChat = () => {
    setShowWelcome(false);
    if (!currentSessionId) {
      handleNewSession();
    }
  };

  const isNewChat = !currentSessionId || currentMessages.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      
      {/* Main Content Area */}
      <div className="pt-20 h-screen flex">
        {/* Sidebar Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-24 left-4 z-30 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl shadow-lg hover:bg-white/30 transition-all duration-200"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Chat Sidebar */}
        <ChatSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          activeSessionId={currentSessionId || undefined}
          onSessionSelect={handleSessionSelect}
          onNewSession={handleNewSession}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative">
          {/* Welcome Message Overlay */}
          {showWelcome && userProfile?.username && isNewChat && (
            <div 
              className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-blue-50/80 via-white/80 to-purple-50/80 backdrop-blur-sm transition-opacity duration-500"
              onClick={handleStartChat}
            >
              <div className="text-center space-y-8 p-8 cursor-pointer">
                <WelcomeMessage 
                  username={userProfile.username}
                  onAnimationComplete={() => {
                    // Optional: Auto-hide after animation complete
                  }}
                />
                <p className="text-gray-500 text-sm animate-pulse">
                  Click anywhere to start chatting
                </p>
              </div>
            </div>
          )}

          <ChatInterface 
            currentSessionId={currentSessionId}
            hasMessages={currentMessages.length > 0}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;