import { Copy, CheckCheck } from "lucide-react";
import { useState } from "react";

interface Props {
  method: "POST" | "GET";
  endpoint: string;
  title: string;
  description?: string;
  baseUrl?: string;
}

export function ApiCard({ method, endpoint, title, description, baseUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const fullUrl = (baseUrl ?? window.location.origin) + endpoint;

  const copy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card rounded-xl border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-md text-white"
          style={{ background: method === "POST" ? "#3b82f6" : "#10b981" }}
        >
          {method}
        </span>
        <code className="text-sm font-mono text-foreground">{endpoint}</code>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded flex items-center justify-center shrink-0"
          style={{ background: "hsl(var(--primary))" }}>
          <svg viewBox="0 0 24 24" className="h-3 w-3 fill-white">
            <path d="M3 11h8V3H3m0 18h8v-8H3m10 8h8v-8h-8m0-10v8h8V3"/>
          </svg>
        </div>
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
        <code className="text-xs font-mono text-foreground flex-1 truncate">{fullUrl}</code>
        <button onClick={copy} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <CheckCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
