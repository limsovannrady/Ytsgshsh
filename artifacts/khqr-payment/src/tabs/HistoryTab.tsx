import { CheckCircle2, Clock, RefreshCw, Loader2 } from "lucide-react";
import { useGetPaymentHistory, getGetPaymentHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { JsonViewer } from "@/components/JsonViewer";
import { useState } from "react";
import { tgHaptic } from "@/lib/tg";

export default function HistoryTab() {
  const queryClient = useQueryClient();
  const [showJson, setShowJson] = useState(false);
  const { data, isLoading, isFetching } = useGetPaymentHistory();

  const refresh = () => {
    tgHaptic.impact("light");
    queryClient.invalidateQueries({ queryKey: getGetPaymentHistoryQueryKey() });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 pt-2 pb-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5 text-muted-foreground">
          <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
        </svg>
        <span className="text-sm font-semibold text-muted-foreground">ឯកសារ API</span>
      </div>

      <div className="bg-card rounded-xl border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-md text-white" style={{ background: "#10b981" }}>GET</span>
          <code className="text-sm font-mono text-foreground">/api/payment/history</code>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded flex items-center justify-center shrink-0" style={{ background: "hsl(var(--primary))" }}>
            <svg viewBox="0 0 24 24" className="h-3 w-3 fill-white"><path d="M3 11h8V3H3m0 18h8v-8H3m10 8h8v-8h-8m0-10v8h8V3"/></svg>
          </div>
          <span className="text-sm font-medium">ប្រវត្តិការទូទាត់ (History)</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={refresh}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ background: "hsl(var(--primary))" }}
          data-testid="button-refresh"
        >
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          ចេញ API
        </button>
        <button
          onClick={() => setShowJson(!showJson)}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          {showJson ? "បង្ហាញបញ្ជី" : "JSON"}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : data && data.length > 0 ? (
        showJson ? (
          <JsonViewer data={data} />
        ) : (
          <div className="space-y-2">
            {data.map((r) => (
              <div key={r.id} className="bg-card border rounded-xl p-3 flex items-center gap-3" data-testid={`row-${r.id}`}>
                <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                  r.status === "paid" ? "bg-green-100" : "bg-amber-100"
                }`}>
                  {r.status === "paid"
                    ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                    : <Clock className="h-5 w-5 text-amber-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{r.currency} {Number(r.amount).toFixed(2)}</p>
                  <code className="text-[11px] font-mono text-muted-foreground truncate block">{r.md5}</code>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  r.status === "paid"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`} data-testid={`status-${r.id}`}>
                  {r.status === "paid" ? "Paid" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">មិនទាន់មានប្រវត្តិ</p>
        </div>
      )}
    </div>
  );
}
