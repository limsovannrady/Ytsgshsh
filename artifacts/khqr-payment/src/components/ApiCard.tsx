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
  const pathOnly = endpoint.split("?")[0];

  const copy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const methodColor = method === "POST" ? "#2563eb" : "#16a34a";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      {/* Method + Path */}
      <div className="space-y-1">
        <span
          className="inline-block text-xs font-bold px-3 py-1 rounded-lg text-white tracking-wide"
          style={{ background: methodColor, fontFamily: "'Kantumruy Pro', sans-serif" }}
        >
          {method}
        </span>
        <p className="font-mono text-sm text-gray-800 break-all">{pathOnly}</p>
      </div>

      {/* Title */}
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke={methodColor} strokeWidth={2}>
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01M17 20h.01M20 14h.01M20 17h.01M20 20h.01"/>
        </svg>
        <span
          className="text-sm font-medium text-gray-500"
          style={{ fontFamily: "'Kantumruy Pro', sans-serif" }}
        >
          {title}
        </span>
      </div>

      {description && (
        <p className="text-xs text-gray-400" style={{ fontFamily: "'Kantumruy Pro', sans-serif" }}>{description}</p>
      )}

      {/* URL Copy Row */}
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
        <code className="text-xs font-mono text-gray-600 flex-1 break-all leading-relaxed">{fullUrl}</code>
        <button
          onClick={copy}
          className="shrink-0 p-1.5 rounded-lg bg-white border border-gray-200 hover:border-blue-300 transition-colors text-gray-400 hover:text-blue-500 shadow-sm"
        >
          {copied
            ? <CheckCheck className="h-3.5 w-3.5 text-green-500" />
            : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
