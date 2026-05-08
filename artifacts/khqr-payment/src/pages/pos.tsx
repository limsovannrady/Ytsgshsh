import { RefreshCw, Building2, AlertCircle } from "lucide-react";
import { useGetPosInfo, getGetPosInfoQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null) return null;
  return (
    <div className="flex items-start justify-between py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right max-w-[60%] break-words">{String(value)}</span>
    </div>
  );
}

export default function PosPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching, error } = useGetPosInfo();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getGetPosInfoQueryKey() });
  };

  const posData = data?.data as Record<string, unknown> | null | undefined;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">POS Information</h1>
          <p className="text-muted-foreground mt-1 text-sm">Point of Sale details from your Bakong account.</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={isFetching} data-testid="button-refresh-pos">
          <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Account Details</CardTitle>
            {data && (
              <Badge variant="outline" className="text-green-600 border-green-400 dark:text-green-400">
                Connected
              </Badge>
            )}
          </div>
          <CardDescription>Bakong POS terminal information for your merchant account.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex justify-between py-3 border-b border-border">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-36" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mb-3 text-destructive opacity-70" />
              <p className="font-medium text-foreground">Failed to load POS info</p>
              <p className="text-sm mt-1">Check your Bakong token and try again.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={refresh} data-testid="button-retry-pos">
                Try Again
              </Button>
            </div>
          ) : posData && Object.keys(posData).length > 0 ? (
            <div>
              {Object.entries(posData).map(([key, value]) => (
                <InfoRow
                  key={key}
                  label={key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  value={typeof value === "object" ? JSON.stringify(value) : (value as string | number | null)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No POS data available</p>
              <p className="text-sm mt-1">Your account may not have POS information configured.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
