import { Copy, CheckCheck } from "lucide-react";
import { useState } from "react";

const endpoints = [
  {
    method: "POST",
    path: "/api/payment/generate-qr",
    color: "#3b82f6",
    title: "បង្កើតកូដ KHQR",
    desc: "បង្កើត KHQR QR Code សម្រាប់ទទួលការទូទាត់",
    body: `{\n  "amount": 0.01,\n  "currency": "USD",\n  "description": "Order #1"\n}`,
    response: `{\n  "status": "success",\n  "qr": "00020101...",\n  "md5": "715de..."\n}`,
  },
  {
    method: "GET",
    path: "/api/payment/check/{md5}",
    color: "#10b981",
    title: "ពិនិត្យការទូទាត់",
    desc: "ពិនិត្យថាតើការទូទាត់ត្រូវបានបញ្ចប់ឬអត់",
    body: null,
    response: `{\n  "status": "paid",\n  "md5": "715de...",\n  "paid": true\n}`,
  },
  {
    method: "GET",
    path: "/api/payment/history",
    color: "#10b981",
    title: "ប្រវត្តិការទូទាត់",
    desc: "ទទួលបញ្ជីប្រតិបត្តិការ 50 ចុងក្រោយ",
    body: null,
    response: `[\n  {\n    "id": 1,\n    "md5": "715de...",\n    "amount": 0.01,\n    "status": "paid"\n  }\n]`,
  },
  {
    method: "GET",
    path: "/api/payment/pos",
    color: "#10b981",
    title: "ព័ត៌មាន POS",
    desc: "ទទួលព័ត៌មានម៉ាស៊ីន POS Bakong",
    body: null,
    response: `{\n  "status": "success",\n  "data": { ... }\n}`,
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="text-white/40 hover:text-white/80 transition-colors">
      {copied ? <CheckCheck className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

export default function DocsTab() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 pt-2 pb-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5 text-muted-foreground">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
        <span className="text-sm font-semibold text-muted-foreground">ឯកសារ API ទាំងអស់</span>
      </div>

      <div className="bg-muted/50 rounded-xl border p-3">
        <p className="text-xs text-muted-foreground mb-1">Base URL</p>
        <code className="text-sm font-mono text-foreground">{window.location.origin}/api</code>
      </div>

      <div className="space-y-3">
        {endpoints.map((ep) => (
          <div key={ep.path} className="bg-card rounded-xl border overflow-hidden">
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded text-white" style={{ background: ep.color }}>{ep.method}</span>
                <code className="text-xs font-mono text-foreground">{ep.path}</code>
              </div>
              <p className="text-xs text-muted-foreground">{ep.desc}</p>
            </div>

            {ep.body && (
              <div className="border-t px-3 py-2" style={{ background: "hsl(var(--json-bg))" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-white/40 font-mono">Request Body</span>
                  <CopyButton text={ep.body} />
                </div>
                <pre className="text-xs font-mono text-green-300 whitespace-pre-wrap">{ep.body}</pre>
              </div>
            )}

            <div className="border-t px-3 py-2" style={{ background: "hsl(220 28% 10%)" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/40 font-mono">Response</span>
                <CopyButton text={ep.response} />
              </div>
              <pre className="text-xs font-mono text-yellow-200/80 whitespace-pre-wrap">{ep.response}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
