import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, CheckCircle2, Clock, Copy, RefreshCw, QrCode } from "lucide-react";
import { useCheckPayment, getCheckPaymentQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

declare global {
  interface Window {
    Telegram?: { WebApp?: { initDataUnsafe?: { user?: { id?: number } } } };
  }
}

function getTelegramUserId(): string {
  return String(window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? "guest");
}

const schema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.enum(["USD", "KHR"]),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function GenerateQrPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [qrData, setQrData] = useState<{ qr: string; md5: string; amount: number; currency: string } | null>(null);
  const [pollEnabled, setPollEnabled] = useState(false);
  const [paid, setPaid] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 0.01, currency: "USD", description: "" },
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const { data: checkData } = useCheckPayment(
    qrData?.md5 ?? "",
    { query: { enabled: pollEnabled && !!qrData?.md5, queryKey: getCheckPaymentQueryKey(qrData?.md5 ?? ""), refetchInterval: 3000 } }
  );

  useEffect(() => {
    if (checkData?.paid) {
      setPaid(true);
      setPollEnabled(false);
      toast({ title: "Payment received!", description: "The payment has been completed successfully." });
    }
  }, [checkData?.paid, toast]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const onSubmit = async (values: FormValues) => {
    setPaid(false);
    setQrData(null);
    setPollEnabled(false);
    setIsGenerating(true);
    try {
      const userId = getTelegramUserId();
      const params = new URLSearchParams({
        type: "generate_qr",
        user_tg_id: userId,
        amount: String(values.amount),
        currency: values.currency,
      });
      if (values.description) params.set("description", values.description);

      const res = await fetch(`${window.location.origin}/api/payment?${params.toString()}`);
      const json = await res.json() as { status: string; data?: { qr: string; md5: string; amount: number; currency: string }; message?: string };

      if (!res.ok || json.status !== "success" || !json.data) {
        throw new Error(json.message ?? "Failed to generate QR code");
      }

      const data = json.data;
      setQrData({ qr: data.qr, md5: data.md5, amount: data.amount, currency: data.currency });
      setPollEnabled(true);
      queryClient.invalidateQueries({ queryKey: getCheckPaymentQueryKey(data.md5) });
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message ?? "Failed to generate QR code.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "MD5 hash copied to clipboard." });
  };

  const reset = () => {
    setQrData(null);
    setPaid(false);
    setPollEnabled(false);
    form.reset();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Generate Payment QR</h1>
        <p className="text-muted-foreground mt-1 text-sm">Enter the payment amount to generate a KHQR code for your customer.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Payment Details</CardTitle>
          <CardDescription>The QR code will be valid until the customer scans and pays.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.01"
                          data-testid="input-amount"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-currency">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="KHR">KHR</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description <span className="text-muted-foreground">(optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Order #1234" data-testid="input-description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isGenerating}
                data-testid="button-generate-qr"
              >
                {isGenerating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><QrCode className="mr-2 h-4 w-4" /> Generate QR Code</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {qrData && (
        <Card className="border-2 transition-all duration-300" style={{ borderColor: paid ? "hsl(var(--chart-3))" : "hsl(var(--border))" }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                {paid ? "Payment Received" : "Scan to Pay"}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={reset} data-testid="button-reset">
                <RefreshCw className="h-4 w-4 mr-1" /> New Payment
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className={`p-4 bg-white rounded-xl shadow-md transition-opacity duration-300 ${paid ? "opacity-50" : ""}`}>
                <QRCodeSVG
                  value={qrData.qr}
                  size={220}
                  level="M"
                  data-testid="img-qr-code"
                />
              </div>
              {paid && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/90 rounded-full p-3 shadow-lg">
                    <CheckCircle2 className="h-14 w-14 text-green-500" />
                  </div>
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {qrData.currency} {Number(qrData.amount).toFixed(2)}
              </p>
              {!paid ? (
                <div className="flex items-center justify-center gap-1.5 mt-1 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 animate-pulse text-accent" />
                  <span>Waiting for payment...</span>
                </div>
              ) : (
                <p className="text-sm text-green-600 font-medium mt-1">Payment confirmed</p>
              )}
            </div>

            <div className="w-full bg-muted rounded-lg p-3">
              <Label className="text-xs text-muted-foreground block mb-1">MD5 Hash (for status check)</Label>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-foreground flex-1 truncate" data-testid="text-md5">{qrData.md5}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 shrink-0"
                  onClick={() => copyToClipboard(qrData.md5)}
                  data-testid="button-copy-md5"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
