import { Copy, CheckCheck } from "lucide-react";
import { useState } from "react";

const USER_TG_ID = "5002402843";

function buildUrl(base: string, params: Record<string, string>) {
  const q = new URLSearchParams(params).toString();
  return `${base}?${q}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="text-white/40 hover:text-white/80 transition-colors shrink-0">
      {copied ? <CheckCheck className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function UrlBox({ url }: { url: string }) {
  return (
    <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
      <code className="text-xs font-mono text-foreground flex-1 break-all">{url}</code>
      <CopyButton text={url} />
    </div>
  );
}

interface EndpointCardProps {
  method: "POST" | "GET";
  color: string;
  title: string;
  desc: string;
  urls: string[];
  params?: { key: string; desc: string; required: boolean }[];
  response: string;
}

function EndpointCard({ method, color, title, desc, urls, params, response }: EndpointCardProps) {
  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded text-white shrink-0" style={{ background: color }}>
            {method}
          </span>
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <p className="text-xs text-muted-foreground">{desc}</p>

        <div className="space-y-1.5">
          {urls.map((url) => <UrlBox key={url} url={url} />)}
        </div>

        {params && (
          <div className="space-y-1 pt-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Query Parameters</p>
            {params.map((p) => (
              <div key={p.key} className="flex items-start gap-2 text-xs">
                <code className="font-mono text-primary shrink-0">{p.key}</code>
                <span className={`text-[10px] px-1 rounded shrink-0 ${p.required ? "bg-red-100 text-red-600" : "bg-muted text-muted-foreground"}`}>
                  {p.required ? "required" : "optional"}
                </span>
                <span className="text-muted-foreground">{p.desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t px-3 py-2.5" style={{ background: "hsl(220 28% 10%)" }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-white/40 font-mono uppercase">Response JSON</span>
          <CopyButton text={response} />
        </div>
        <pre className="text-xs font-mono text-yellow-200/80 whitespace-pre-wrap break-all">{response}</pre>
      </div>
    </div>
  );
}

export default function DocsTab() {
  const base = `${window.location.origin}/api/payment`;

  const endpoints: EndpointCardProps[] = [
    {
      method: "POST",
      color: "#3b82f6",
      title: "បង្កើតកូដ KHQR",
      desc: "Generate KHQR QR Code — ផ្ញើ amount តាម query parameter",
      urls: [
        buildUrl(base, { type: "generate_qr", user_tg_id: USER_TG_ID, amount: "0.01" }),
        buildUrl(base, { type: "generate_qr", user_tg_id: USER_TG_ID, amount: "1.50", currency: "USD" }),
      ],
      params: [
        { key: "type", desc: "generate_qr", required: true },
        { key: "user_tg_id", desc: USER_TG_ID, required: true },
        { key: "amount", desc: "ទឹកប្រាក់ (ឧ. 0.01, 1.50)", required: true },
        { key: "currency", desc: "USD ឬ KHR (default: USD)", required: false },
        { key: "description", desc: "កំណត់ចំណាំ", required: false },
      ],
      response: `{\n  "status": "success",\n  "data": {\n    "qr": "00020101...",\n    "md5": "715de...",\n    "amount": 0.01,\n    "currency": "USD"\n  }\n}`,
    },
    {
      method: "GET",
      color: "#10b981",
      title: "ពិនិត្យការទូទាត់",
      desc: "Check payment status by MD5 hash",
      urls: [
        buildUrl(base, { type: "check_md5", user_tg_id: USER_TG_ID, md5: "YOUR_MD5_HERE" }),
      ],
      params: [
        { key: "type", desc: "check_md5", required: true },
        { key: "user_tg_id", desc: USER_TG_ID, required: true },
        { key: "md5", desc: "MD5 hash ពី generate_qr", required: true },
      ],
      response: `{\n  "status": "success",\n  "paid": true,\n  "md5": "715de...",\n  "data": { ... }\n}`,
    },
    {
      method: "GET",
      color: "#10b981",
      title: "ប្រវត្តិការទូទាត់",
      desc: "Get last 50 payment transactions",
      urls: [
        buildUrl(base, { type: "history", user_tg_id: USER_TG_ID }),
      ],
      params: [
        { key: "type", desc: "history", required: true },
        { key: "user_tg_id", desc: USER_TG_ID, required: true },
      ],
      response: `{\n  "status": "success",\n  "data": [\n    { "md5": "...", "amount": 0.01, "status": "paid" }\n  ]\n}`,
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 pt-2 pb-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5 text-muted-foreground">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
        <span className="text-sm font-semibold text-muted-foreground">ឯកសារ API</span>
      </div>

      <div className="bg-muted/60 rounded-xl border p-3 space-y-1">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Base URL</p>
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono text-foreground flex-1 break-all">{base}</code>
          <CopyButton text={base} />
        </div>
      </div>

      <div className="space-y-3">
        {endpoints.map((ep) => (
          <EndpointCard key={ep.title} {...ep} />
        ))}
      </div>
    </div>
  );
}
