import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Inbox, RotateCcw, ScanSearch, Users } from "lucide-react";
import { resetDemo } from "@/lib/demo-store";
import { cn } from "@/lib/utils";

const STEPS = [
  { to: "/outlook", label: "1. Outlook inbox", icon: Inbox },
  { to: "/", label: "2. Contact Capture", icon: ScanSearch },
  { to: "/dynamics", label: "3. Dynamics contacts", icon: Users },
] as const;

export function DemoSwitcher() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const idx = STEPS.findIndex((s) => s.to === path);
  const next = idx >= 0 && idx < STEPS.length - 1 ? STEPS[idx + 1] : null;

  const handleReset = () => {
    resetDemo();
    // A full restart clears every screen's local UI state and resets the
    // simulated integration counters as well as the shared demo records.
    window.location.assign("/outlook");
  };

  return (
    <nav aria-label="Demo steps" className="demo-switcher sticky top-0 z-50 flex h-10 items-center gap-1 border-b bg-foreground px-3 text-sm text-background">
      <span className="mr-3 font-semibold uppercase tracking-wider opacity-70">Prototype</span>
      {STEPS.map((s) => (
        <Link
          key={s.to}
          to={s.to}
          className={cn(
            "flex items-center gap-1.5 rounded px-2.5 py-1 transition-colors hover:bg-background/15",
            path === s.to && "bg-background/20 font-semibold",
          )}
        >
          <s.icon className="h-3.5 w-3.5" /> {s.label}
        </Link>
      ))}
      <div className="ml-auto flex items-center gap-2">
        {next && (
          <Link to={next.to} className="flex items-center gap-1 rounded bg-background px-2.5 py-1 font-medium text-foreground">
            Next step <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 rounded px-2.5 py-1 hover:bg-background/15"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset demo
        </button>
      </div>
    </nav>
  );
}
