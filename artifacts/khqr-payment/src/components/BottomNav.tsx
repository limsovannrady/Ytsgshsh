import { Home, History, Settings } from "lucide-react";
import type { TabId } from "@/App";
import { tgHaptic } from "@/lib/tg";

const tabs: { id: TabId; icon: typeof Home; label: string }[] = [
  { id: "home",     icon: Home,     label: "ទំព័រដើម" },
  { id: "history",  icon: History,  label: "ប្រវត្តិ" },
  { id: "settings", icon: Settings, label: "កំណត់" },
];

interface Props { active: TabId; onChange: (t: TabId) => void; }

export function BottomNav({ active, onChange }: Props) {
  const handleTab = (id: TabId) => {
    if (id !== active) tgHaptic.selection();
    onChange(id);
  };

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg border-t bg-card"
      style={{
        borderColor: "hsl(var(--nav-border))",
        paddingBottom: "max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="flex">
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => handleTab(id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors"
              style={{ color: isActive ? "hsl(var(--nav-active))" : "hsl(var(--nav-inactive))" }}
              data-testid={`tab-${id}`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
