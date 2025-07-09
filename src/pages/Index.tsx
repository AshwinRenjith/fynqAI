
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import ChatInterface from "@/components/ChatInterface";
import ChatSidebar from "@/components/ChatSidebar";
import { WelcomeMessage } from "@/components/WelcomeMessage";
import { Survey } from "@/components/Survey";
import { BackendStatus } from "@/components/BackendStatus";
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
  const [hasShownWelcomeForSession, setHasShownWelcomeForSession] = useState<string | null>(null);
  const { 
    currentSessionId, 
    currentMessages, 
    switchToSession, 
    startNewChat 
  } = useChat();

  // Add sessionId state
  const [sessionId, setSessionId] = useState<string | null>(null);
  // Update initial messages to include timestamp
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  // Add chatStarted state
  const [chatStarted, setChatStarted] = useState(false);
  // Add chatKey state
  const [chatKey, setChatKey] = useState(Date.now());
  // Add chatSessions state
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  // Add activeSessionId state
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  // Add motivationalMessage state
  const [motivationalMessage, setMotivationalMessage] = useState<string | null>(null);

  // Fetch messages when sessionId changes
  useEffect(() => {
    if (!sessionId) return;
    setLoadingMessages(true);
    supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages(
          (data || []).map((m) => ({
            sender: m.is_user ? 'user' : 'ai',
            text: m.content,
            timestamp: m.created_at,
          }))
        );
        setLoadingMessages(false);
      });
  }, [sessionId]);

  // Load user profile and check survey status
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      
      try {
        // Get user profile - use maybeSingle() to avoid PGRST116 error
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        // If no profile exists, create one
        if (!profile && !profileError) {
          console.log('No profile found, creating one...');
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{
              user_id: user.id,
              username: user.email?.split('@')[0] || 'user',
              first_name: user.user_metadata?.first_name || '',
              last_name: user.user_metadata?.last_name || ''
            }])
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
          } else {
            profile = newProfile;
            console.log('Profile created successfully:', profile);
          }
        }

        if (profileError) {
          console.error('Error loading profile:', profileError);
          return;
        }

        setUserProfile(profile);

        // Check if user has completed survey - use maybeSingle() here too
        const { data: survey, error: surveyError } = await supabase
          .from('survey_responses')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (surveyError) {
          console.error('Error checking survey:', surveyError);
          return;
        }

        if (!survey) {
          setShowSurvey(true);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    if (user && !loading) {
      loadUserProfile();
    }
  }, [user, loading]);

  // Show welcome message only for new sessions that haven't shown it yet
  useEffect(() => {
    if (userProfile?.username && currentSessionId && currentMessages.length === 0) {
      // Only show welcome if we haven't shown it for this session yet
      if (hasShownWelcomeForSession !== currentSessionId) {
        setShowWelcome(true);
        setHasShownWelcomeForSession(currentSessionId);
      }
    } else {
      setShowWelcome(false);
    }
  }, [userProfile, currentSessionId, currentMessages.length, hasShownWelcomeForSession]);

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
    setSessionId(sessionId);
    setActiveSessionId(sessionId);
    setSidebarOpen(false);
    // Messages will be fetched by useEffect
  };

  const handleNewSession = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        title: 'New Chat',
      })
      .select()
      .single();
    if (error || !data) return;
    setSessionId(data.id);
    setMessages([
      {
        sender: 'ai',
        text: 'Hi there! How can I help you today?',
        timestamp: new Date().toISOString(),
      },
    ]);
    setChatStarted(false);
    setChatKey(Date.now());
    setActiveSessionId(data.id);
    setSidebarOpen(false);
    // Insert welcome message into chat_messages
    await supabase.from('chat_messages').insert({
      session_id: data.id,
      content: 'Hi there! How can I help you today?',
      is_user: false,
    });
  };

  const handleStartChat = () => {
    setShowWelcome(false);
    if (!currentSessionId) {
      handleNewSession();
    }
  };

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

        {/* Main Chat Area - slides when sidebar is open */}
        <div className={`flex-1 flex flex-col relative transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-80' : 'ml-0'
        }`}>
          {/* Welcome Message Overlay */}
          {showWelcome && userProfile?.username && (
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
            key={chatKey}
            onChatStarted={() => setChatStarted(true)}
            messages={messages}
            setMessages={setMessages}
            sessionId={sessionId}
            onSendMessage={async (msg) => {
              if (!sessionId) return;
              await supabase.from('chat_messages').insert({
                session_id: sessionId,
                content: msg.text,
                is_user: msg.sender === 'user',
                created_at: msg.timestamp,
              });
            }}
          />
        </div>
      </div>

      {/* Backend Status Indicator */}
      <BackendStatus />
    </div>
  );
};

export default Index;
