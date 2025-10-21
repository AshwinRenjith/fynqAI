import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      toast({
        title: "Supabase not configured",
        description: "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: "Welcome back",
      description: "You are now signed in.",
    });

    navigate("/");
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[520px] w-[520px] rounded-full bg-primary/40 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16 lg:flex-row lg:items-center lg:gap-20">
        <div className="max-w-xl space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-medium text-white/70 backdrop-blur-xl">
            <Sparkles className="h-4 w-4" />
            Seamless AI Workspace
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Sign in to unlock your intelligent command center.
          </h1>
          <p className="text-lg text-white/60">
            Access personalized automation, deep research, and project execution—from a single glass dashboard.
          </p>
        </div>

        <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/10 p-[1.5px] shadow-[0_38px_120px_rgba(12,17,36,0.45)] backdrop-blur-2xl">
          <div className="rounded-[30px] bg-slate-900/80 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-white/80">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="judha@domain.com"
                    className="h-12 rounded-2xl border-white/10 bg-white/10 text-white placeholder:text-white/40 focus-visible:border-white/30 focus-visible:ring-white/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-white/80">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="h-12 rounded-2xl border-white/10 bg-white/10 text-white placeholder:text-white/40 focus-visible:border-white/30 focus-visible:ring-white/30"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-white/60">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-transparent" />
                  Remember me
                </label>
                <Link to="#" className="font-medium text-white/75 transition-colors hover:text-white">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="group w-full justify-center gap-2 rounded-2xl bg-white text-slate-900 hover:bg-white/90"
              >
                {isSubmitting ? "Signing in…" : "Sign In"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>

              <p className="text-sm text-center text-white/60">
                Don’t have an account?{" "}
                <Link to="/signup" className="font-semibold text-white/80 underline-offset-4 transition-colors hover:text-white">
                  Create one now
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
