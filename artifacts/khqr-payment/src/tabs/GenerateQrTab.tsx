import { useState } from "react";
import { Loader2, Play, CheckCircle2, Clock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useGenerateQr, useCheckPayment, getCheckPaymentQueryKey, customFetch, useGetSettings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiCard } from "@/components/ApiCard";
import { JsonViewer } from "@/components/JsonViewer";
import { useToast } from "@/hooks/use-toast";

const BAKONG_LOGO = "https://bakong.nbc.gov.kh/images/logo.png";

export default function GenerateQrTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Logo from settings ─────────────────────────────────────────────────────
  const { data: settings } = useGetSettings();
  const uploadedLogo = settings?.["LOGO_DATA"] ?? null;
  const logoSrc = uploadedLogo || BAKONG_LOGO;

  // ── Generate QR state ──────────────────────────────────────────────────────
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  const [generateResult, setGenerateResult] = useState<unknown>(null);
  const [qrData, setQrData] = useState<{ qr: string; md5: string; amount: number; currency: string } | null>(null);
  const [paid, setPaid] = useState(false);

  const generateQr = useGenerateQr();

  useCheckPayment(
    qrData?.md5 ?? "",
    {
      query: {
        enabled: !!qrData?.md5 && !paid,
        queryKey: getCheckPaymentQueryKey(qrData?.md5 ?? ""),
        refetchInterval: 3000,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onSuccess: (data: any) => {
          if (data?.paid) {
            setPaid(true);
            toast({ title: "បានទូទាត់ហើយ!", description: "ការទូទាត់ត្រូវបានបញ្ជាក់។" });
          }
        },
      },
    }
  );

  const handleGenerate = () => {
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) {
      toast({ title: "សូមបញ្ចូលទឹកប្រាក់", variant: "destructive" });
      return;
    }
    setPaid(false);
    setQrData(null);
    generateQr.mutate(
      { data: { amount: num, currency, description: description || undefined } },
      {
        onSuccess: (data) => {
          setGenerateResult(data);
          setQrData({ qr: data.qr, md5: data.md5, amount: data.amount, currency: data.currency });
          queryClient.invalidateQueries({ queryKey: getCheckPaymentQueryKey(data.md5) });
        },
        onError: (e: unknown) => {
          const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "មិនអាចបង្កើត QR បានទេ — សូមពិនិត្យការកំណត់";
          setGenerateResult({ status: "error", message: msg });
          toast({ title: "Error", description: msg, variant: "destructive" });
        },
      }
    );
  };

  // ── Check MD5 state ────────────────────────────────────────────────────────
  const [md5Input, setMd5Input] = useState("");
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<unknown>(null);

  const handleCheck = async () => {
    const md5 = md5Input.trim();
    if (!md5) return;
    setCheckLoading(true);
    setCheckResult(null);
    await queryClient.invalidateQueries({ queryKey: getCheckPaymentQueryKey(md5) });
    const res = await queryClient.fetchQuery({
      queryKey: getCheckPaymentQueryKey(md5),
      queryFn: () => customFetch(`/api/payment/check/${encodeURIComponent(md5)}`),
    });
    setCheckResult(res);
    setCheckLoading(false);
  };

  const handleCheckKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleCheck(); };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pt-2 pb-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5 text-muted-foreground">
          <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
        </svg>
        <span className="text-sm font-semibold text-muted-foreground">ឯកសារ API</span>
      </div>

      {/* ── POST: Generate QR ── */}
      <ApiCard method="POST" endpoint="/api/payment/generate-qr" title="បង្កើតកូដ KHQR (Generate)" />

      <div className="bg-card rounded-xl border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-primary">
            <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
          </svg>
          <span className="text-sm font-semibold text-primary">សាកល្បង POST</span>
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="ទឹកប្រាក់ (Ex: 0.01)"
            className="flex-1 bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            data-testid="input-amount"
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            data-testid="select-currency"
          >
            <option value="USD">USD</option>
            <option value="KHR">KHR</option>
          </select>
        </div>

        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="កំណត់ចំណាំ (optional)"
          className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          data-testid="input-description"
        />

        <button
          onClick={handleGenerate}
          disabled={generateQr.isPending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ background: "hsl(var(--primary))" }}
          data-testid="button-generate"
        >
          {generateQr.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> កំពុងបង្កើត...</>
          ) : (
            <><Play className="h-4 w-4 fill-white" /> ចេញ API</>
          )}
        </button>
      </div>

      {/* QR Code display */}
      {qrData && (
        <div className="bg-card rounded-xl border p-4 flex flex-col items-center gap-3">
          <div className="relative">
            <div className={`p-3 bg-white rounded-xl shadow transition-opacity ${paid ? "opacity-40" : ""}`}>
              <div className="relative inline-block">
                <QRCodeSVG
                  value={qrData.qr}
                  size={180}
                  level="M"
                  data-testid="img-qrcode"
                />
                {uploadedLogo && (
                  <img
                    src={uploadedLogo}
                    alt="logo"
                    className="absolute rounded-full object-cover border-2 border-white shadow"
                    style={{
                      width: 40,
                      height: 40,
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                )}
              </div>
            </div>
            {paid && (
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 drop-shadow-lg" />
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">{qrData.currency} {Number(qrData.amount).toFixed(2)}</p>
            {paid ? (
              <p className="text-sm text-green-600 font-medium">បានទូទាត់រួចរាល់</p>
            ) : (
              <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5 animate-pulse text-primary" />
                <span>រង់ចាំការទូទាត់...</span>
              </div>
            )}
          </div>
          <div className="w-full bg-muted rounded-lg px-3 py-2">
            <p className="text-[10px] text-muted-foreground mb-0.5">MD5</p>
            <code className="text-xs font-mono break-all" data-testid="text-md5">{qrData.md5}</code>
          </div>
        </div>
      )}

      {generateResult && <JsonViewer data={generateResult} />}

      {/* Divider */}
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 border-t border-border" />
        <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">ឬ</span>
        <div className="flex-1 border-t border-border" />
      </div>

      {/* ── GET: Check MD5 ── */}
      <ApiCard
        method="GET"
        endpoint={`/api/payment/check/${md5Input.trim() || "YOUR_MD5_HERE"}`}
        title="ពិនិត្យការទូទាត់ (Check MD5)"
      />

      <div className="bg-card rounded-xl border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-emerald-600">
            <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
          </svg>
          <span className="text-sm font-semibold text-emerald-600">សាកល្បង GET</span>
        </div>

        <input
          type="text"
          value={md5Input}
          onChange={(e) => setMd5Input(e.target.value)}
          onKeyDown={handleCheckKey}
          placeholder="បញ្ចូល MD5 Hash..."
          className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/30"
          data-testid="input-md5"
        />

        <button
          onClick={handleCheck}
          disabled={checkLoading || !md5Input.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ background: "#10b981" }}
          data-testid="button-check"
        >
          {checkLoading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> កំពុងពិនិត្យ...</>
          ) : (
            <><Play className="h-4 w-4 fill-white" /> ចេញ API</>
          )}
        </button>
      </div>

      {checkResult && <JsonViewer data={checkResult} />}
    </div>
  );
}
