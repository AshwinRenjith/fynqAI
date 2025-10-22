import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Upgrade = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/70">
          Unlock fynqAI Plus
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">
          Elevate your creative workflows with faster responses and deeper automations.
        </h1>
        <p className="text-lg text-white/60">
          Upgrade to access advanced research, project memory, and premium collaboration spaces as soon as they roll out.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Button className="w-full max-w-sm rounded-2xl bg-white text-slate-900 hover:bg-white/90">
            Upgrade now
          </Button>
          <Button
            variant="ghost"
            className="text-white/70 hover:text-white"
            onClick={() => navigate("/")}
          >
            Back to workspace
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
