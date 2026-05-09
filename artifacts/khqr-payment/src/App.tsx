import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import GenerateQrTab from "@/tabs/GenerateQrTab";
import CheckPaymentTab from "@/tabs/CheckPaymentTab";
import HistoryTab from "@/tabs/HistoryTab";
import PosTab from "@/tabs/PosTab";
import DocsTab from "@/tabs/DocsTab";
import SettingsTab from "@/tabs/SettingsTab";
import { BottomNav } from "@/components/BottomNav";
import { TelegramContext, type TelegramUser } from "./TelegramContext";
import { setAuthTokenGetter } from "@workspace/api-client-react";

const queryClient = new QueryClient();

export type TabId = "home" | "check" | "history" | "pos" | "docs" | "settings";

function Dashboard() {
  const [tab, setTab] = useState<TabId>("home");
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto relative">
      <main className="flex-1 overflow-y-auto pb-20">
        {tab === "home" && <GenerateQrTab />}
        {tab === "check" && <CheckPaymentTab />}
        {tab === "history" && <HistoryTab />}
        {tab === "pos" && <PosTab />}
        {tab === "docs" && <DocsTab />}
        {tab === "settings" && <SettingsTab />}
      </main>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

function App() {
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      const user = tg.initDataUnsafe.user as TelegramUser;
      setTgUser(user);
      setAuthTokenGetter(() => String(user.id));
    }
  }, []);

  return (
    <TelegramContext.Provider value={tgUser}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Dashboard />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </TelegramContext.Provider>
  );
}

export default App;
