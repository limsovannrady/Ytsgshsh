import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { useCheckPayment, getCheckPaymentQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiCard } from "@/components/ApiCard";
import { JsonViewer } from "@/components/JsonViewer";

export default function CheckPaymentTab() {
  const queryClient = useQueryClient();
  const [md5Input, setMd5Input] = useState("");
  const [activeMd5, setActiveMd5] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);

  const { refetch } = useCheckPayment(
    activeMd5,
    { query: { enabled: false, queryKey: getCheckPaymentQueryKey(activeMd5) } }
  );

  const handleCall = async () => {
    const md5 = md5Input.trim();
    if (!md5) return;
    setActiveMd5(md5);
    setLoading(true);
    setResult(null);
    await queryClient.invalidateQueries({ queryKey: getCheckPaymentQueryKey(md5) });
    const res = await queryClient.fetchQuery({
      queryKey: getCheckPaymentQueryKey(md5),
      queryFn: async () => {
        const r = await fetch(`/api/payment/check/${encodeURIComponent(md5)}`);
        return r.json();
      },
    });
    setResult(res);
    setLoading(false);
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleCall(); };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 pt-2 pb-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5 text-muted-foreground">
          <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
        </svg>
        <span className="text-sm font-semibold text-muted-foreground">ឯកសារ API</span>
      </div>

      <ApiCard
        method="GET"
        endpoint={`/api/payment?type=check_md5&user_tg_id=5002402843&md5=${md5Input.trim() || "YOUR_MD5_HERE"}`}
        title="ពិនិត្យការទូទាត់ (Check MD5)"
      />

      <div className="bg-card rounded-xl border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-primary">
            <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
          </svg>
          <span className="text-sm font-semibold text-primary">សាកល្បងផ្សេង</span>
        </div>

        <input
          type="text"
          value={md5Input}
          onChange={(e) => setMd5Input(e.target.value)}
          onKeyDown={handleKey}
          placeholder="បញ្ចូល MD5 Hash..."
          className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/30"
          data-testid="input-md5"
        />

        <button
          onClick={handleCall}
          disabled={loading || !md5Input.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ background: "#10b981" }}
          data-testid="button-check"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> កំពុងពិនិត្យ...</>
          ) : (
            <><Play className="h-4 w-4 fill-white" /> ចេញ API</>
          )}
        </button>
      </div>

      {result && <JsonViewer data={result} />}
    </div>
  );
}
