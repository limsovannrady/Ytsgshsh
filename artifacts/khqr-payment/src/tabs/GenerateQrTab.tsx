import { useState } from "react";
import { Loader2, Play, CheckCircle2, Clock, Copy, Check, ImageDown } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCheckPayment, getCheckPaymentQueryKey, customFetch, useGetSettings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiCard } from "@/components/ApiCard";
import { JsonViewer } from "@/components/JsonViewer";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    Telegram?: { WebApp?: { initDataUnsafe?: { user?: { id?: number } } } };
  }
}

function getTelegramUserId(): string {
  return String(window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? "guest");
}

const KH = { fontFamily: "'Kantumruy Pro', sans-serif" };

export default function GenerateQrTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings } = useGetSettings();
  const uploadedLogo = settings?.["LOGO_DATA"] ?? null;

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [generateResult, setGenerateResult] = useState<unknown>(null);
  const [qrData, setQrData] = useState<{ qr: string; md5: string; amount: number; currency: string } | null>(null);
  const [paid, setPaid] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedPng, setCopiedPng] = useState(false);
  const [pngUrl, setPngUrl] = useState<string | null>(null);

  useCheckPayment(qrData?.md5 ?? "", {
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
  });

  const handleGenerate = async () => {
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) {
      toast({ title: "សូមបញ្ចូលទឹកប្រាក់", variant: "destructive" });
      return;
    }
    setPaid(false);
    setQrData(null);
    setPngUrl(null);
    setIsGenerating(true);
    try {
      const userId = getTelegramUserId();
      const params = new URLSearchParams({ type: "generate_qr", user_tg_id: userId, amount: String(num), currency });

      const res = await fetch(`${window.location.origin}/api/payment?${params.toString()}`);
      const json = await res.json() as {
        status: string;
        data?: { qr: string; md5: string; amount: number; currency: string; url_qr_code?: string };
        message?: string;
      };

      if (!res.ok || json.status !== "success" || !json.data) {
        throw new Error(json.message ?? "មិនអាចបង្កើត QR បានទេ — សូមពិនិត្យការកំណត់");
      }

      const data = json.data;
      setGenerateResult(json);
      setQrData({ qr: data.qr, md5: data.md5, amount: data.amount, currency: data.currency });
      queryClient.invalidateQueries({ queryKey: getCheckPaymentQueryKey(data.md5) });
      if (data.url_qr_code) setPngUrl(data.url_qr_code);
    } catch (e: unknown) {
      const msg = (e as Error)?.message ?? "មិនអាចបង្កើត QR បានទេ — សូមពិនិត្យការកំណត់";
      setGenerateResult({ status: "error", message: msg });
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

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

  const userId = getTelegramUserId();
  const generateEndpoint = `/api/payment?type=generate_qr&user_tg_id=${userId}&amount=${amount || "0.01"}${currency !== "USD" ? `&currency=${currency}` : ""}`;
  const checkEndpoint = `/api/payment?type=check_md5&user_tg_id=${userId}&md5=${md5Input.trim() || "YOUR_MD5"}`;

  return (
    <div className="p-4 space-y-4" style={KH}>

      {/* ══════════════════════════════════════════
          SECTION 1 — Generate QR
      ══════════════════════════════════════════ */}
      <ApiCard method="GET" endpoint={generateEndpoint} title="បង្កើតកូដ KHQR (Generate)" />

      {/* Lab test card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/60">
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2} className="h-4 w-4 shrink-0">
            <path d="M9 3v11l-4 5h14l-4-5V3"/><path d="M6 3h12"/>
          </svg>
          <span className="text-sm font-semibold text-blue-600" style={KH}>សាកល្បងផ្ទាល់</span>
        </div>

        <div className="p-4 space-y-3">
          {/* Amount + Currency row */}
          <div className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="ទឹកប្រាក់ (Ex: 0.01)"
              className="flex-1 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-shadow"
              style={KH}
              data-testid="input-amount"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200 transition-shadow"
              style={KH}
            >
              <option value="USD">USD</option>
              <option value="KHR">KHR</option>
            </select>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 shadow-sm hover:opacity-90 active:scale-[0.98]"
            style={{ background: "#2563eb", ...KH }}
            data-testid="button-generate"
          >
            {isGenerating
              ? <><Loader2 className="h-4 w-4 animate-spin" /> កំពុងបង្កើត...</>
              : <><Play className="h-4 w-4 fill-white" /> ចេញ API</>}
          </button>
        </div>
      </div>

      {/* QR Code display */}
      {qrData && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-4">
          <div className="relative">
            <div className={`p-3 bg-white rounded-xl border border-gray-100 shadow-sm transition-opacity ${paid ? "opacity-40" : ""}`}>
              <div className="relative inline-block">
                <QRCodeSVG value={qrData.qr} size={180} level="M" data-testid="img-qrcode" />
                {uploadedLogo && (
                  <img
                    src={uploadedLogo}
                    alt="logo"
                    className="absolute rounded-full object-cover border-2 border-white shadow"
                    style={{ width: 40, height: 40, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
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
          <div className="text-center space-y-1">
            <p className="font-bold text-xl text-gray-800" style={KH}>
              {qrData.currency} {Number(qrData.amount).toFixed(2)}
            </p>
            {paid ? (
              <p className="text-sm text-green-600 font-semibold" style={KH}>បានទូទាត់រួចរាល់ ✓</p>
            ) : (
              <div className="flex items-center justify-center gap-1.5 text-sm text-gray-400" style={KH}>
                <Clock className="h-3.5 w-3.5 animate-pulse text-blue-500" />
                <span>រង់ចាំការទូទាត់...</span>
              </div>
            )}
          </div>
          <div className="w-full bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
            <p className="text-[10px] text-gray-400 mb-0.5 font-medium uppercase tracking-wider">MD5</p>
            <code className="text-xs font-mono text-gray-600 break-all" data-testid="text-md5">{qrData.md5}</code>
          </div>
        </div>
      )}

      {/* PNG URL Card */}
      {pngUrl && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10"
            style={{ background: "linear-gradient(90deg,#0d2044,#1e40af)" }}
          >
            <ImageDown className="h-3.5 w-3.5 text-white/70" />
            <span className="text-xs font-semibold text-white" style={KH}>URL រូបភាព QR Code (PNG)</span>
          </div>
          <div className="p-3 space-y-2.5">
            <div className="flex justify-center">
              <img src={pngUrl} alt="QR PNG" className="h-28 w-28 rounded-xl border border-gray-100 shadow-sm bg-white object-contain" />
            </div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <code className="flex-1 text-[10px] font-mono text-gray-500 break-all leading-relaxed">{pngUrl}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(pngUrl).then(() => { setCopiedPng(true); setTimeout(() => setCopiedPng(false), 2000); }); }}
                className="shrink-0 p-1.5 rounded-lg bg-white border border-gray-200 hover:border-blue-300 transition-colors text-gray-400 hover:text-blue-500 shadow-sm"
              >
                {copiedPng ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <a
              href={pngUrl}
              download={`khqr-${qrData?.md5?.slice(0, 8) ?? "qr"}.png`}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#2563eb", ...KH }}
            >
              <ImageDown className="h-3.5 w-3.5" />
              ទាញយក PNG
            </a>
          </div>
        </div>
      )}

      {generateResult && <JsonViewer data={generateResult} />}

      {/* ── Divider ── */}
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase" style={KH}>ឬ</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* ══════════════════════════════════════════
          SECTION 2 — Check MD5
      ══════════════════════════════════════════ */}
      <ApiCard method="GET" endpoint={checkEndpoint} title="ផ្ទៀងផ្ទាត់ការបង់ប្រាក់ (Verify)" />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/60">
          <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2} className="h-4 w-4 shrink-0">
            <path d="M9 3v11l-4 5h14l-4-5V3"/><path d="M6 3h12"/>
          </svg>
          <span className="text-sm font-semibold text-green-600" style={KH}>សាកល្បងផ្ទាល់</span>
        </div>

        <div className="p-4 space-y-3">
          <input
            type="text"
            value={md5Input}
            onChange={(e) => setMd5Input(e.target.value)}
            onKeyDown={handleCheckKey}
            placeholder="បញ្ចូលលេខកូដ MD5"
            className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-shadow"
            style={KH}
            data-testid="input-md5"
          />
          <button
            onClick={handleCheck}
            disabled={checkLoading || !md5Input.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 shadow-sm hover:opacity-90 active:scale-[0.98]"
            style={{ background: "#16a34a", ...KH }}
            data-testid="button-check"
          >
            {checkLoading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> កំពុងពិនិត្យ...</>
              : <><Play className="h-4 w-4 fill-white" /> ចេញ API</>}
          </button>
        </div>
      </div>

      {checkResult && <JsonViewer data={checkResult} />}
    </div>
  );
}
