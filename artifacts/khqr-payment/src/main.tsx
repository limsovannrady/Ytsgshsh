import { createRoot } from "react-dom/client";
import App from "./App";
import { TelegramGate } from "./TelegramGate";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <TelegramGate>
    <App />
  </TelegramGate>
);
