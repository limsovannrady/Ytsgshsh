import { createRoot } from "react-dom/client";
import App from "./App";
import { TelegramGate } from "./TelegramGate";
import PayPage from "./pages/PayPage";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const urlParams = new URLSearchParams(window.location.search);
const isPayPage = urlParams.has("user_tg_id") && urlParams.has("amount");

createRoot(document.getElementById("root")!).render(
  isPayPage ? (
    <QueryClientProvider client={queryClient}>
      <PayPage />
    </QueryClientProvider>
  ) : (
    <TelegramGate>
      <App />
    </TelegramGate>
  )
);
