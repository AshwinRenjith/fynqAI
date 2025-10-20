import { Home, Compass, BookOpen, Clock, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface ChatSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const ChatSidebar = ({ isCollapsed }: ChatSidebarProps) => {
  const [activeNav, setActiveNav] = useState("home");

  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "explore", icon: Compass, label: "Explore" },
    { id: "library", icon: BookOpen, label: "Library" },
    { id: "history", icon: Clock, label: "History" },
  ];

  const chatHistory = [
    {
      period: "Tomorrow",
      chats: [
        "What's something you've learnt...",
        "If you could teleport anywhere...",
        "What's one goal you want to ac...",
      ],
    },
    {
      period: "7 Days Ago",
      chats: [
        "Ask me anything weird or rand...",
        "How are you feeling today, reall...",
        "What's one habit you wish you...",
      ],
    },
  ];

  if (isCollapsed) {
    return (
      <div className="w-20 h-screen glass-strong border-r border-border/30 flex flex-col items-center py-6 gap-6 transition-smooth shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          className="transition-spring hover:scale-110"
        >
          <Plus className="w-5 h-5" />
        </Button>
        
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="icon"
            onClick={() => setActiveNav(item.id)}
            className={`transition-spring ${
              activeNav === item.id
                ? "glass-card text-accent shadow-md scale-110"
                : "hover:scale-110"
            }`}
          >
            <item.icon className="w-5 h-5" />
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-80 h-screen glass-strong border-r border-border/30 flex flex-col transition-smooth shadow-xl relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-[1.125rem] gradient-primary flex items-center justify-center shadow-glow transition-spring hover:scale-110">
              <span className="text-white font-semibold">B</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground">BeeBot</h2>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
            <Input
              placeholder="Search"
              className="pl-11 shadow-sm"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 mb-6">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => setActiveNav(item.id)}
              className={`w-full justify-start gap-3 mb-1 transition-spring ${
                activeNav === item.id
                  ? "glass-card text-accent shadow-sm"
                  : "hover:scale-[1.02]"
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </Button>
          ))}
        </nav>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-3 pb-6">
          {chatHistory.map((section) => (
            <div key={section.period} className="mb-6">
              <h3 className="text-xs font-semibold text-muted-foreground/70 mb-2 px-3">
                {section.period}
              </h3>
              {section.chats.map((chat, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  className="w-full justify-start text-left mb-1 px-3 transition-spring hover:scale-[1.02] hover:glass text-sm text-muted-foreground hover:text-foreground"
                >
                  <span className="truncate">{chat}</span>
                </Button>
              ))}
            </div>
          ))}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-border/30 glass">
          <div className="flex items-center gap-3 p-3 rounded-2xl hover:glass-card cursor-pointer transition-spring hover:shadow-md">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-accent to-primary-glow shadow-glow" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Judha Mayusiya</p>
              <p className="text-xs text-muted-foreground/70 truncate">judha.design@gmail.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
