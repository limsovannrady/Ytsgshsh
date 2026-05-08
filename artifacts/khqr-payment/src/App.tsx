import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import GenerateQrTab from "@/tabs/GenerateQrTab";
import CheckPaymentTab from "@/tabs/CheckPaymentTab";
import HistoryTab from "@/tabs/HistoryTab";
import PosTab from "@/tabs/PosTab";
import DocsTab from "@/tabs/DocsTab";
import { BottomNav } from "@/components/BottomNav";

const queryClient = new QueryClient();

export type TabId = "home" | "check" | "history" | "pos" | "docs";

function App() {
  const [tab, setTab] = useState<TabId>("home");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto relative">
          <main className="flex-1 overflow-y-auto pb-20">
            {tab === "home" && <GenerateQrTab />}
            {tab === "check" && <CheckPaymentTab />}
            {tab === "history" && <HistoryTab />}
            {tab === "pos" && <PosTab />}
            {tab === "docs" && <DocsTab />}
          </main>
          <BottomNav active={tab} onChange={setTab} />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
