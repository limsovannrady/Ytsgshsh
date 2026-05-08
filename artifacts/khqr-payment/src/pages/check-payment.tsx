import { useState } from "react";
import { CheckCircle2, XCircle, Search, Loader2 } from "lucide-react";
import { useCheckPayment, getCheckPaymentQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function CheckPaymentPage() {
  const [md5Input, setMd5Input] = useState("");
  const [activeMd5, setActiveMd5] = useState("");

  const { data, isLoading, isFetching } = useCheckPayment(
    activeMd5,
    { query: { enabled: !!activeMd5, queryKey: getCheckPaymentQueryKey(activeMd5) } }
  );

  const handleCheck = () => {
    const trimmed = md5Input.trim();
    if (!trimmed) return;
    setActiveMd5(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCheck();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Check Payment Status</h1>
        <p className="text-muted-foreground mt-1 text-sm">Enter the MD5 hash from a generated QR code to check if the payment was completed.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Payment Lookup</CardTitle>
          <CardDescription>The MD5 hash is shown after generating a QR code.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="md5-input">MD5 Hash</Label>
            <div className="flex gap-2">
              <Input
                id="md5-input"
                value={md5Input}
                onChange={(e) => setMd5Input(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste MD5 hash here..."
                className="font-mono text-sm"
                data-testid="input-md5"
              />
              <Button
                onClick={handleCheck}
                disabled={!md5Input.trim() || isLoading || isFetching}
                data-testid="button-check-payment"
              >
                {(isLoading || isFetching) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <><Search className="h-4 w-4 mr-1" /> Check</>
                )}
              </Button>
            </div>
          </div>

          {data && activeMd5 && (
            <div
              className={`rounded-lg border-2 p-5 flex items-center gap-4 transition-all duration-300 ${
                data.paid
                  ? "border-green-400 bg-green-50 dark:bg-green-950/20"
                  : "border-amber-400 bg-amber-50 dark:bg-amber-950/20"
              }`}
              data-testid="status-payment-result"
            >
              {data.paid ? (
                <CheckCircle2 className="h-10 w-10 text-green-500 shrink-0" />
              ) : (
                <XCircle className="h-10 w-10 text-amber-500 shrink-0" />
              )}
              <div>
                <p className="font-semibold text-foreground text-lg">
                  {data.paid ? "Payment Confirmed" : "Payment Pending"}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {data.paid
                    ? "This transaction has been successfully completed."
                    : "This payment has not been received yet."}
                </p>
                <code className="text-xs font-mono text-muted-foreground mt-2 block">{data.md5}</code>
              </div>
            </div>
          )}

          {!data && activeMd5 && !isLoading && !isFetching && (
            <p className="text-sm text-muted-foreground text-center py-4">No result found for this hash.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
