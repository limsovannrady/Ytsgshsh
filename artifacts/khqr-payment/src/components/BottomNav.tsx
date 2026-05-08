import { Home, Package, History, Settings2, Code2 } from "lucide-react";
import type { TabId } from "@/App";

const tabs: { id: TabId; icon: typeof Home; label: string }[] = [
  { id: "home",    icon: Home,      label: "ទំព័រដើម" },
  { id: "check",   icon: Package,   label: "ពិនិត្យ" },
  { id: "history", icon: History,   label: "ប្រវត្តិ" },
  { id: "pos",     icon: Settings2, label: "POS" },
  { id: "docs",    icon: Code2,     label: "ឯកសារ" },
];

interface Props { active: TabId; onChange: (t: TabId) => void; }

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg border-t bg-white"
      style={{ borderColor: "hsl(var(--nav-border))" }}
    >
      <div className="flex">
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
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
