import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

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
