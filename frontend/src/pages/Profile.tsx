import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const { data: dashboard, isLoading, isError, error } = useStudentDashboard(user?.id);

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      return;
    }

    const load = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    };

    load();

    const { data: subscription } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, []);

  const displayName = useMemo(() => {
    if (!user) return "Guest";
    const fullName = (user.user_metadata?.full_name as string | undefined)?.trim();
    if (fullName) return fullName;
    return user.email ?? "Guest";
  }, [user]);

  const email = user?.email ?? "Sign in to see more details";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="max-w-xl w-full space-y-6 rounded-3xl border border-white/10 bg-white/10 p-[1.5px] shadow-[0_38px_120px_rgba(12,17,36,0.45)] backdrop-blur-2xl">
        <div className="rounded-[30px] bg-slate-900/80 p-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] space-y-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Account</h1>
            <p className="text-white/60 text-sm">Manage how you show up across fynqAI.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-6">
            <p className="text-sm font-medium text-white/70">Display name</p>
            <p className="text-lg font-semibold text-white">{displayName}</p>
            <div className="mt-4 text-sm text-white/60">
              <p>Email</p>
              <p className="font-medium text-white">{email}</p>
            </div>
          </div>
          {user && (
            <div className="rounded-2xl border border-white/10 bg-white/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">Learning streak</p>
                  <p className="text-lg font-semibold text-white">
                    {isLoading ? "Loading..." : `${dashboard?.active_streak_days ?? 0} day${(dashboard?.active_streak_days ?? 0) === 1 ? "" : "s"}`}
                  </p>
                </div>
                {dashboard?.dominant_style && (
                  <div className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80">
                    Prefers {dashboard.dominant_style.replace(/_/g, " ")}
                  </div>
                )}
              </div>

              {isError && (
                <p className="rounded-xl bg-red-500/20 px-4 py-2 text-sm text-red-100">
                  {(error as Error).message || "We couldn't load your learning insights."}
                </p>
              )}

              {dashboard && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Strengths</p>
                    <ul className="mt-2 space-y-1 text-sm text-white/80">
                      {dashboard.strengths.length > 0 ? (
                        dashboard.strengths.map((item) => <li key={item}>{item}</li>)
                      ) : (
                        <li>No strengths recorded yet.</li>
                      )}
                    </ul>
                  </div>
                  <div className="rounded-xl bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Focus areas</p>
                    <ul className="mt-2 space-y-1 text-sm text-white/80">
                      {dashboard.weaknesses.length > 0 ? (
                        dashboard.weaknesses.map((item) => <li key={item}>{item}</li>)
                      ) : (
                        <li>No flagged topics right now.</li>
                      )}
                    </ul>
                  </div>
                  <div className="rounded-xl bg-white/5 p-4 md:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Recommended topics</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {dashboard.recent_topics.length > 0 ? (
                        dashboard.recent_topics.map((topic) => (
                          <span key={topic} className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/80">
                            {topic}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-white/70">No recent topics tracked yet.</span>
                      )}
                    </div>
                  </div>
                  {dashboard.subject_focus.length > 0 && (
                    <div className="rounded-xl bg-white/5 p-4 md:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Subject mastery</p>
                      <div className="mt-3 space-y-3">
                        {dashboard.subject_focus.map((item) => (
                          <div key={item.subject}>
                            <div className="flex items-center justify-between text-xs font-medium text-white/80">
                              <span>{item.subject}</span>
                              <span>{Math.round(item.proficiency * 100)}%</span>
                            </div>
                            <Progress value={Math.round(item.proficiency * 100)} className="mt-1 h-2 bg-white/10" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {dashboard?.alerts.length ? (
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 text-sm text-white/80 space-y-2">
                  {dashboard.alerts.map((alert) => (
                    <p key={alert} className="rounded-lg bg-white/10 px-3 py-2">{alert}</p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/60">Alerts tailored to you will show up here as you study.</p>
              )}
            </div>
          )}
          {!user ? (
            <Button
              onClick={() => navigate("/login")}
              className="w-full rounded-2xl bg-white text-slate-900 hover:bg-white/90"
            >
              Sign in
            </Button>
          ) : (
            <Button
              onClick={() => navigate("/")}
              className="w-full rounded-2xl bg-white text-slate-900 hover:bg-white/90"
            >
              Back to workspace
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
