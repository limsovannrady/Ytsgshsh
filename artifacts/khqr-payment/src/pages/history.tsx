import { format } from "date-fns";
import { CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentRecord {
  id: number;
  qr: string;
  md5: string;
  amount: number;
  currency: string;
  description: string | null;
  status: string;
  createdAt: string;
}

const HISTORY_KEY = ["payment-history-all"];

async function fetchAllHistory(): Promise<PaymentRecord[]> {
  const res = await fetch(`${window.location.origin}/api/payment?type=history&user_tg_id=_`);
  const json = await res.json() as { status: string; data?: PaymentRecord[] };
  if (json.status === "success" && json.data) return json.data;
  return [];
}

export default function HistoryPage() {
  const { data: records, isLoading, isFetching, refetch } = useQuery({
    queryKey: HISTORY_KEY,
    queryFn: fetchAllHistory,
    refetchInterval: 5000,
  });

  const refresh = () => { refetch(); };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment History</h1>
          <p className="text-muted-foreground mt-1 text-sm">Recent payment transactions from your Bakong account.</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={isFetching} data-testid="button-refresh-history">
          <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Transactions</CardTitle>
          <CardDescription>Showing up to 50 recent transactions.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-0">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : records && records.length > 0 ? (
            <div className="divide-y divide-border">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors"
                  data-testid={`row-payment-${record.id}`}
                >
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                    record.status === "paid"
                      ? "bg-green-100 dark:bg-green-950/30"
                      : "bg-amber-100 dark:bg-amber-950/30"
                  }`}>
                    {record.status === "paid" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {record.currency} {Number(record.amount).toFixed(2)}
                      </span>
                      {record.description && (
                        <span className="text-sm text-muted-foreground truncate">— {record.description}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <code className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">{record.md5}</code>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(record.createdAt), "MMM d, yyyy HH:mm")}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={record.status === "paid" ? "default" : "secondary"}
                    className={record.status === "paid" ? "bg-green-500 hover:bg-green-600 text-white" : ""}
                    data-testid={`status-payment-${record.id}`}
                  >
                    {record.status === "paid" ? "Paid" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Clock className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No transactions yet</p>
              <p className="text-sm mt-1">Generate your first QR code to see payments here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
