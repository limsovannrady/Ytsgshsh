import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import GenerateQrTab from "@/tabs/GenerateQrTab";
import CheckPaymentTab from "@/tabs/CheckPaymentTab";
import HistoryTab from "@/tabs/HistoryTab";
import SettingsTab from "@/tabs/SettingsTab";
import { BottomNav } from "@/components/BottomNav";

const queryClient = new QueryClient();

export type TabId = "home" | "check" | "history" | "settings";

function Dashboard() {
  const [tab, setTab] = useState<TabId>("home");
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto relative">
      <main className="flex-1 overflow-y-auto pb-20">
        {tab === "home" && <GenerateQrTab />}
        {tab === "check" && <CheckPaymentTab />}
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
