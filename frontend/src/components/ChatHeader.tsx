import { ChevronDown, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  onToggleSidebar: () => void;
}

const ChatHeader = ({ onToggleSidebar }: ChatHeaderProps) => {
  return (
    <div className="border-b border-border/30 glass-strong relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <div className="flex items-center justify-between px-6 py-4 relative z-10">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="transition-spring hover:scale-110 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>

          <Button
            variant="glass"
            className="gap-2 transition-spring hover:scale-105"
          >
            <div className="w-6 h-6 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
              <span className="text-white text-xs font-bold">B</span>
            </div>
            <span className="font-semibold text-foreground">iBeeBot 4o</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            className="gap-2 transition-spring hover:scale-105 shadow-glow-strong"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">New Chat</span>
          </Button>

          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary via-accent to-primary-glow cursor-pointer hover:scale-110 transition-spring shadow-glow" />
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
