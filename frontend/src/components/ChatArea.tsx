import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Loader2, MoveRight, Paperclip, Rocket, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { useMutation } from "@tanstack/react-query";
import { uploadDoubt } from "@/api/doubts";
import { generateAnswer } from "@/api/answers";
import type { AnswerGenerationResponse, FollowUpPlan } from "@/types/api";
import { ApiError } from "@/lib/apiClient";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";

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

const ChatArea = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [followUpPlan, setFollowUpPlan] = useState<FollowUpPlan | null>(null);
  const [answerMetadata, setAnswerMetadata] = useState<AnswerGenerationResponse["metadata"] | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      return;
    }

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    };

    loadSession();

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authSubscription?.subscription.unsubscribe();
    };
  }, []);

  const greetingName = useMemo(() => {
    if (!user) {
      return "there";
    }

    const fullName = (user.user_metadata?.full_name as string | undefined)?.trim();
    if (fullName) {
      return fullName.split(" ")[0];
    }

    if (user.email) {
      return user.email.split("@")[0];
    }

    return "there";
  }, [user]);

  const { data: dashboard } = useStudentDashboard(user?.id);

  const answerMutation = useMutation({
    mutationFn: async ({ userId, message }: { userId: string; message: string }) => {
      const uploadResponse = await uploadDoubt({
        userId,
        text: message,
      });
      const answerResponse = await generateAnswer({ doubtId: uploadResponse.doubt_id });
      return {
        uploadResponse,
        answerResponse,
      };
    },
  });

  const isProcessing = answerMutation.isPending;
  const hasUserMessage = useMemo(() => messages.some((message) => message.role === "user"), [messages]);
  const showLanding = !hasUserMessage && messages.length === 0;
  const showConversation = !showLanding || isProcessing;

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages, followUpPlan, isProcessing]);

  const processMessage = useCallback(async () => {
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
    setFollowUpPlan(null);
    setAnswerMetadata(null);

    try {
      const userId = user?.id ?? "anonymous";
      const { answerResponse } = await answerMutation.mutateAsync({ userId, message: trimmed });

      setMessages((previous) => [
        ...previous,
        createMessage("assistant", answerResponse.response_text || "I found the answer for you."),
      ]);

      const plan = answerResponse.metadata?.follow_up_plan ?? null;
      if (plan) {
        const normalisedPlan: FollowUpPlan = {
          hints: plan.hints ?? [],
          quiz: plan.quiz ?? [],
          revision_plan: plan.revision_plan ?? [],
          recommended_topics: plan.recommended_topics ?? [],
          encouragement: plan.encouragement ?? null,
        };
        setFollowUpPlan(normalisedPlan);

        const topics = normalisedPlan.recommended_topics ?? [];
        if (topics.length > 0) {
          toast({
            title: "Recommended next topics",
            description: topics.join(", "),
          });
        }
      }

      setAnswerMetadata(answerResponse.metadata ?? null);
    } catch (error) {
      let description = "Something went wrong while contacting the tutor. Try again in a moment.";
      if (error instanceof ApiError) {
        description = typeof error.payload === "string" ? error.payload : error.message;
      }
      setFollowUpPlan(null);
      setAnswerMetadata(null);
      toast({
        title: "Request failed",
        description,
        variant: "destructive",
      });
      setMessages((previous) => [
        ...previous,
        createMessage("assistant", "I ran into a problem generating that answer. Let's try again soon."),
      ]);
    }
  }, [answerMutation, inputValue, isProcessing, toast, user]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void processMessage();
    },
    [processMessage],
  );

  const handleTextareaKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void processMessage();
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

  const baseActions = useMemo(
    () => [
      {
        icon: Sparkles,
        label: "Deep Study",
        action: () => handleQuickInsert("Guide me through a deep study session on AI workspace automation."),
      },
      {
        icon: MoveRight,
        label: "Study Space",
        action: () => handleQuickInsert("Set up a structured study space plan for today's learning agenda."),
      },
      {
        icon: Rocket,
        label: "Pop Quiz",
        action: () => handleQuickInsert("Give me a pop quiz on the latest productivity research."),
      },
    ],
    [handleQuickInsert],
  );

  const recommendedTopics = useMemo(() => {
    const fromDashboard = dashboard?.recent_topics ?? [];
    const fromPlan = followUpPlan?.recommended_topics ?? [];
    return Array.from(new Set([...fromPlan, ...fromDashboard])).slice(0, 3);
  }, [dashboard, followUpPlan]);

  const topicActions = useMemo(
    () =>
      recommendedTopics.map((topic) => ({
        icon: Sparkles,
        label: `Review ${topic}`,
        action: () => handleQuickInsert(`Help me strengthen my understanding of ${topic}.`),
      })),
    [handleQuickInsert, recommendedTopics],
  );

  const shortcutActions = useMemo(() => [...baseActions, ...topicActions], [baseActions, topicActions]);

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
      {showLanding && (
        <div className="relative z-10 text-center max-w-2xl">
          {/* Icon with enhanced glass effect */}
          <div className="mb-10 flex justify-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-[2rem] gradient-primary flex items-center justify-center shadow-glow-strong animate-scale-in glass-card transition-spring hover:scale-110">
                <span className="text-2xl font-semibold tracking-wide text-white">fynqAI</span>
              </div>
              <div className="absolute inset-0 rounded-[2rem] gradient-primary opacity-50 blur-2xl animate-pulse group-hover:opacity-70 transition-smooth" />
            </div>
          </div>

          {/* Greeting */}
          <h1 className="text-6xl font-semibold mb-3 text-foreground animate-fade-in tracking-tight">
            Good Morning, {greetingName}
          </h1>
          <p className="text-4xl animate-fade-in leading-tight" style={{ animationDelay: "0.15s" }}>
            How Can I{" "}
            <span className="font-semibold bg-gradient-to-r from-primary via-accent to-primary-glow bg-300% bg-clip-text text-transparent animate-gradient">
              Assist You Today?
            </span>
          </p>
        </div>
      )}

      {showConversation && (
        <div className="relative z-10 mt-16 flex w-full justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div
            ref={transcriptRef}
            className="w-full max-w-4xl space-y-5 px-6 text-left max-h-[460px] overflow-y-auto"
          >
            {messages.map((message) => {
              const isAssistant = message.role === "assistant";
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-full",
                    isAssistant ? "justify-start" : "justify-end",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-3xl px-5 py-4 text-sm leading-relaxed shadow-[0_18px_40px_rgba(15,18,35,0.12)]",
                      isAssistant
                        ? "bg-white text-neutral-900"
                        : "bg-gradient-to-r from-primary via-accent to-primary-glow text-white",
                    )}
                  >
                    {message.content.split(/\n{2,}/).map((paragraph, index) => (
                      <p key={index} className={index > 0 ? "mt-3" : undefined}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
            {isProcessing && (
              <div className="flex w-full justify-start">
                <div className="flex items-center gap-3 rounded-3xl bg-white px-5 py-3 text-sm text-neutral-700 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Crafting a tailored response…
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Liquid glass chatbox */}
      <div className="relative z-10 mt-10 flex w-full justify-center animate-fade-in" style={{ animationDelay: "0.35s" }}>
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

                <button
                  type="button"
                  onClick={() => void processMessage()}
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

            {showLanding && (
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
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {followUpPlan && (
        <div className="relative z-10 mt-24 w-full max-w-3xl animate-fade-in" style={{ animationDelay: "0.45s" }}>
          <div className="glass-card rounded-3xl border border-white/20 bg-white/30 p-6 shadow-[0_28px_80px_rgba(15,18,36,0.18)]">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Personalised follow-up</h2>
            {followUpPlan.hints.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-2">Hints</h3>
                <ul className="space-y-2 text-neutral-800 text-sm">
                  {followUpPlan.hints.map((hint, index) => (
                    <li key={index} className="rounded-2xl bg-white/70 px-4 py-2 shadow-sm">
                      {hint}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {followUpPlan.quiz.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-2">Quick quiz</h3>
                {followUpPlan.quiz.map((item, index) => (
                  <div key={index} className="mb-3 rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
                    <p className="font-medium text-neutral-900">{item.question}</p>
                    <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                      {item.options.map((option, optionIndex) => (
                        <li key={optionIndex} className={cn("rounded-xl px-3 py-1", optionIndex === item.correct_option ? "bg-primary/10 text-primary" : "bg-neutral-100")}>{option}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {followUpPlan.revision_plan.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-2">Revision plan</h3>
                <ul className="list-disc space-y-1 pl-6 text-sm text-neutral-700">
                  {followUpPlan.revision_plan.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
            {followUpPlan.encouragement && (
              <div className="rounded-2xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
                {followUpPlan.encouragement}
              </div>
            )}
            {answerMetadata && (
              <div className="mt-5 grid gap-3 rounded-2xl border border-neutral-200 bg-white/80 p-4 text-xs text-neutral-700 md:grid-cols-2">
                {answerMetadata.subject && (
                  <div>
                    <p className="font-semibold uppercase tracking-wide text-neutral-500">Subject focus</p>
                    <p className="mt-1 text-sm text-neutral-900">{answerMetadata.subject}</p>
                  </div>
                )}
                {answerMetadata.context_count !== undefined && (
                  <div>
                    <p className="font-semibold uppercase tracking-wide text-neutral-500">Contexts referenced</p>
                    <p className="mt-1 text-sm text-neutral-900">{answerMetadata.context_count}</p>
                  </div>
                )}
                {answerMetadata.context_ids && answerMetadata.context_ids.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="font-semibold uppercase tracking-wide text-neutral-500">Reference IDs</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {answerMetadata.context_ids.map((contextId) => (
                        <span
                          key={contextId}
                          className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-600"
                        >
                          {contextId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {(hasUserMessage || isProcessing) && (
        <div className="sr-only" aria-live="polite">
          {messages[messages.length - 1].content}
        </div>
      )}
    </div>
  );
};

export default ChatArea;
