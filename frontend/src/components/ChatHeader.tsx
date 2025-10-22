import { ChevronDown, Plus, Menu } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatHeaderProps {
  onToggleSidebar: () => void;
}

const ChatHeader = ({ onToggleSidebar }: ChatHeaderProps) => {
  const [activeModel, setActiveModel] = useState("GPT 5");

  const models = useMemo(
    () => ["Gemini 2.5", "Perplexity", "GPT 5"],
    [],
  );

  return (
    <div className="flex items-center justify-between px-6 py-4">
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="glass"
              className="gap-2 transition-spring hover:scale-105"
            >
              <div className="w-6 h-6 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
                <span className="text-white text-xs font-bold">B</span>
              </div>
              <span className="font-semibold text-foreground">{activeModel}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuLabel>Models</DropdownMenuLabel>
            {models.map((model) => (
              <DropdownMenuItem
                key={model}
                onClick={() => setActiveModel(model)}
                className={model === activeModel ? "font-medium" : undefined}
              >
                {model}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
  );
};

export default ChatHeader;
