import { RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { useGetPosInfo, getGetPosInfoQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { JsonViewer } from "@/components/JsonViewer";
import { useState } from "react";

export default function PosTab() {
  const queryClient = useQueryClient();
  const [called, setCalled] = useState(false);
  const { data, isLoading, isFetching, error, refetch } = useGetPosInfo({
    query: { enabled: called, queryKey: getGetPosInfoQueryKey() },
  });

  const handleCall = () => {
    setCalled(true);
    if (called) refetch();
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
          <code className="text-sm font-mono text-foreground">/api/payment/pos</code>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded flex items-center justify-center shrink-0" style={{ background: "hsl(var(--primary))" }}>
            <svg viewBox="0 0 24 24" className="h-3 w-3 fill-white"><path d="M3 11h8V3H3m0 18h8v-8H3m10 8h8v-8h-8m0-10v8h8V3"/></svg>
          </div>
          <span className="text-sm font-medium">ព័ត៌មាន POS (Get POS Info)</span>
        </div>
        <p className="text-xs text-muted-foreground">ទទួលបានព័ត៌មានម៉ាស៊ីន POS Bakong</p>
      </div>

      <button
        onClick={handleCall}
        disabled={isLoading || isFetching}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        style={{ background: "hsl(var(--primary))" }}
        data-testid="button-get-pos"
      >
        {(isLoading || isFetching) ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> កំពុងទាញ...</>
        ) : (
          <><RefreshCw className="h-4 w-4" /> ចេញ API</>
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">មានបញ្ហា — ពិនិត្យ BAKONG_TOKEN រួចហើយព្យាយាមម្តងទៀត</p>
        </div>
      )}

      {data && <JsonViewer data={data} />}
    </div>
  );
}
