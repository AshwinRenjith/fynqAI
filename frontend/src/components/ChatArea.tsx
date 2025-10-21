import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  Mic,
  MoveRight,
  Paperclip,
  Rocket,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const createMessage = (role: ChatMessage["role"], content: string): ChatMessage => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
});

const generateAiResponse = (prompt: string) => {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("image")) {
    return "Sure! I’ll outline the visual direction and assets we should create.";
  }

  if (normalized.includes("persona") || normalized.includes("audience")) {
    return "Let’s build a persona profile with goals, frustrations, and core motivations.";
  }

  if (normalized.includes("search")) {
    return "I’ll scan the latest resources and surface the most relevant highlights.";
  }

  return "Got it! I’ll craft a thoughtful reply with next steps you can use right away.";
};

const ChatArea = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage("assistant", "Hey Judha! Ready to explore something new today?"),
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processMessage = useCallback(() => {
    const trimmed = inputValue.trim();

    if (!trimmed || isProcessing) {
      if (!trimmed) {
        toast({
          title: "Nothing to send",
          description: "Add a thought or pick a quick action below.",
        });
      }
      return;
    }

    const userMessage = createMessage("user", trimmed);
    setMessages((previous) => [...previous, userMessage]);
    setInputValue("");
    setIsProcessing(true);

    const aiDraft = generateAiResponse(trimmed);
    window.setTimeout(() => {
      setMessages((previous) => [...previous, createMessage("assistant", aiDraft)]);
      setIsProcessing(false);
    }, 700);
  }, [inputValue, isProcessing, toast]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      processMessage();
    },
    [processMessage],
  );

  const handleTextareaKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        processMessage();
      }
    },
    [processMessage],
  );

  const handleQuickInsert = useCallback((text: string) => {
    setInputValue(text);
    toast({
      title: "Prompt drafted",
      description: "Tweak it or send it as-is.",
    });
  }, [toast]);

  const handleMicClick = useCallback(() => {
    toast({
      title: "Voice mode",
      description: "Voice capture coming soon—stay tuned!",
    });
  }, [toast]);

  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    const summary = Array.from(files)
      .slice(0, 3)
      .map((file) => file.name)
      .join(", ");

    toast({
      title: "Attachment queued",
      description: `${summary}${files.length > 3 ? " and more" : ""}.`,
    });

    event.target.value = "";
  }, [toast]);

  const shortcutActions = [
    {
      icon: Sparkles,
      label: "DeepSearch",
      action: () => handleQuickInsert("Deep search the latest trends in AI productivity workflows."),
    },
    {
      icon: MoveRight,
      label: "Create Images",
      action: () => handleQuickInsert("Generate a clean hero illustration for our workspace dashboard."),
    },
    {
      icon: Rocket,
      label: "Try Projects",
      action: () => handleQuickInsert("Map out a 4-week launch plan for our new AI assistant."),
    },
    {
      icon: UserRound,
      label: "Personas",
      action: () => handleQuickInsert("Define 3 personas who would benefit from our AI workspace."),
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 relative overflow-hidden">
      {/* Gradient Blob Background - Enhanced */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full gradient-mesh opacity-70 blur-3xl animate-pulse" />
        <div
          className="absolute w-[300px] h-[300px] rounded-full bg-gradient-to-br from-accent/20 to-primary/20 blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
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
      </div>

      {/* Liquid glass chatbox */}
      <div className="relative z-10 mt-28 flex w-full justify-center animate-fade-in" style={{ animationDelay: "0.35s" }}>
        <div className="relative w-full max-w-4xl px-6">
          <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-5">
            <div className="relative w-full rounded-[38px] border border-white/30 bg-white/15 p-[1.25px] shadow-[0_35px_90px_rgba(15,18,30,0.15)] backdrop-blur-[22px]">
              <div className="relative flex items-center gap-4 rounded-[36px] bg-white/35 px-8 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <button
                  type="button"
                  onClick={handleFileClick}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/70 text-neutral-600 transition-transform duration-200 hover:scale-105 hover:text-neutral-900"
                  aria-label="Attach"
                >
                  <Paperclip className="h-5 w-5" />
                </button>

                <Textarea
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder="What do you want to know?"
                  disabled={isProcessing}
                  rows={1}
                  className="flex-1 resize-none border-0 bg-transparent px-0 text-lg font-medium text-neutral-800 placeholder:text-neutral-400 focus-visible:ring-0"
                />

                <div className="flex items-center gap-3 text-sm font-semibold text-neutral-700">
                  <button
                    type="button"
                    onClick={() => toast({ title: "Mode switched", description: "Auto mode adapts to your request." })}
                    className="flex items-center gap-1 rounded-full border border-white/60 bg-white/70 px-4 py-2 transition-transform duration-200 hover:scale-[1.02]"
                  >
                    Auto
                    <MoveRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleMicClick}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-white transition-transform duration-200 hover:scale-105"
                    aria-label="Voice input"
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={processMessage}
                  disabled={isProcessing || inputValue.trim().length === 0}
                  className="ml-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-[0_20px_40px_rgba(255,255,255,0.24)] transition-transform duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:bg-white/40 disabled:text-neutral-400"
                  aria-label="Send"
                >
                  <MoveRight className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="hidden" />

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={handleFileChange}
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              {shortcutActions.map(({ icon: Icon, label, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  className="flex items-center gap-3 rounded-full border border-white/35 bg-white/25 px-6 py-3 text-sm font-semibold text-neutral-600 shadow-[0_18px_50px_rgba(15,18,30,0.12)] transition-transform duration-200 hover:scale-105 hover:bg-white/35"
                >
                  <Icon className="h-5 w-5" />
                  {label}
                  {label === "Try Projects" && <MoveRight className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="sr-only" aria-live="polite">
          {messages[messages.length - 1].content}
        </div>
      )}
    </div>
  );
};

export default ChatArea;
