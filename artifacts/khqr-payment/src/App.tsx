import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import GenerateQrTab from "@/tabs/GenerateQrTab";
import HistoryTab from "@/tabs/HistoryTab";
import SettingsTab from "@/tabs/SettingsTab";
import { BottomNav } from "@/components/BottomNav";

const queryClient = new QueryClient();

export type TabId = "home" | "history" | "settings";

function Dashboard() {
  const [tab, setTab] = useState<TabId>("home");
  return (
    <div
      className="bg-background flex flex-col max-w-lg mx-auto relative"
      style={{ height: "var(--tg-viewport-stable-height, 100svh)" }}
    >
      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: "calc(4rem + max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)))" }}
      >
        {tab === "home" && <GenerateQrTab />}
        {tab === "history" && <HistoryTab />}
        {tab === "settings" && <SettingsTab />}
      </main>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Dashboard />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
