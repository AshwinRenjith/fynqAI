import { Sparkles } from "lucide-react";

const ChatArea = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 relative overflow-hidden">
      {/* Gradient Blob Background - Enhanced */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full gradient-mesh opacity-70 blur-3xl animate-pulse" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-gradient-to-br from-accent/20 to-primary/20 blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl">
        {/* Icon with enhanced glass effect */}
        <div className="mb-10 flex justify-center">
          <div className="relative group">
            <div className="w-24 h-24 rounded-[2rem] gradient-primary flex items-center justify-center shadow-glow-strong animate-scale-in glass-card transition-spring hover:scale-110">
              <Sparkles className="w-12 h-12 text-white drop-shadow-lg" />
            </div>
            <div className="absolute inset-0 rounded-[2rem] gradient-primary opacity-50 blur-2xl animate-pulse group-hover:opacity-70 transition-smooth" />
          </div>
        </div>

        {/* Greeting */}
        <h1 className="text-6xl font-semibold mb-3 text-foreground animate-fade-in tracking-tight">
          Good Morning, Judha
        </h1>
        <p className="text-4xl animate-fade-in leading-tight" style={{ animationDelay: "0.15s" }}>
          How Can I{" "}
          <span className="font-semibold bg-gradient-to-r from-primary via-accent to-primary-glow bg-300% bg-clip-text text-transparent animate-gradient">
            Assist You Today?
          </span>
        </p>

        {/* Suggestion with liquid glass */}
        <div className="mt-16 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="inline-flex items-center gap-3 px-8 py-4 glass-card rounded-[1.5rem] shadow-lg hover:shadow-xl hover:glass-strong transition-spring cursor-pointer group">
            <Sparkles className="w-5 h-5 text-primary group-hover:rotate-12 transition-spring drop-shadow-sm" />
            <span className="text-sm text-muted-foreground font-medium">
              Initiate a query or send a command to the AI...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
