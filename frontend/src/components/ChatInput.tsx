import { Paperclip, Search, Lightbulb, Wand2, FileSearch, Mic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const ChatInput = () => {
  const [message, setMessage] = useState("");

  const actions = [
    { icon: Paperclip, label: "Attach" },
    { icon: Search, label: "Search" },
    { icon: Lightbulb, label: "Reasoning" },
    { icon: Wand2, label: "Create Image" },
    { icon: FileSearch, label: "Deep Research" },
  ];

  return (
    <div className="border-t border-border/30 p-6 glass">
      <div className="max-w-4xl mx-auto">
        {/* Main Input Container */}
        <div className="glass-card rounded-[2rem] shadow-lg p-6 relative overflow-hidden">
          {/* Subtle backdrop glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            {/* Top Row - Input with Icon */}
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Initiate a query or send a command to the AI..."
                className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 text-base placeholder:text-muted-foreground/60 h-6 px-0"
              />
            </div>

            {/* Bottom Row - Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {actions.map((action, index) => (
                  <Button
                    key={action.label}
                    variant={index === 0 ? "ghost" : "secondary"}
                    size="sm"
                    className="gap-2 transition-spring hover:scale-105 rounded-xl"
                  >
                    <action.icon className="w-4 h-4" />
                    <span className="text-xs font-medium hidden sm:inline">
                      {action.label}
                    </span>
                  </Button>
                ))}
              </div>

              {/* Mic Button */}
              <Button
                size="icon"
                className="transition-spring hover:scale-110 active:scale-95 shadow-glow-strong rounded-xl w-10 h-10"
              >
                <Mic className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
