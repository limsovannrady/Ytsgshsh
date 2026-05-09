import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Clock, Loader2, AlertCircle } from "lucide-react";

interface QrData {
  qr: string;
  md5: string;
  amount: number;
  currency: string;
}

const BAKONG_LOGO = "https://bakong.nbc.gov.kh/images/logo.png";
const POLL_INTERVAL = 3000;

function formatAmount(amount: number, currency: string) {
  if (currency === "KHR") {
    return `${Number(amount).toLocaleString()} ៛`;
  }
  return `$${Number(amount).toFixed(2)}`;
}

export default function PayPage() {
  const params = new URLSearchParams(window.location.search);
  const userTgId = params.get("user_tg_id") ?? "";
  const amount = params.get("amount") ?? "";
  const currency = (params.get("currency") ?? "USD").toUpperCase();
  const description = params.get("description") ?? "";

  const [qrData, setQrData] = useState<QrData | null>(null);
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userTgId || !amount) {
      setError("Missing user_tg_id or amount parameter.");
      setLoading(false);
      return;
    }

    const generate = async () => {
      setLoading(true);
      setError(null);
      try {
        const p = new URLSearchParams({ type: "generate_qr", user_tg_id: userTgId, amount, currency });
        if (description) p.set("description", description);
        const res = await fetch(`${window.location.origin}/api/payment?${p}`);
        const json = await res.json() as { status: string; data?: QrData; message?: string };
        if (!res.ok || json.status !== "success" || !json.data) throw new Error(json.message ?? "Failed to generate QR");
        setQrData(json.data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    generate();
  }, [userTgId, amount, currency, description]);

  useEffect(() => {
    if (!qrData?.md5 || paid) return;
    const timer = setInterval(async () => {
      try {
        const p = new URLSearchParams({ type: "check_md5", user_tg_id: userTgId, md5: qrData.md5 });
        const res = await fetch(`${window.location.origin}/api/payment?${p}`);
        const json = await res.json() as { paid?: boolean };
        if (json.paid) setPaid(true);
      } catch {}
    }, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [qrData?.md5, paid, userTgId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)" }}>

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <img src={BAKONG_LOGO} alt="Bakong" className="h-10 mb-3 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <h1 className="text-white text-lg font-bold">Bakong KHQR Payment</h1>
          {description && <p className="text-slate-400 text-sm mt-1">{description}</p>}
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              <p className="text-slate-500 text-sm">កំពុងបង្កើត QR Code...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
              <AlertCircle className="h-10 w-10 text-red-500" />
              <p className="text-slate-700 font-medium">មិនអាចបង្កើត QR បាន</p>
              <p className="text-slate-500 text-sm">{error}</p>
            </div>
          ) : qrData ? (
            <div className="flex flex-col items-center p-6 gap-4">
              <div className="relative">
                <div className={`p-3 bg-white rounded-xl border-2 transition-all duration-500 ${paid ? "border-green-400 opacity-40" : "border-slate-100"}`}>
                  <QRCodeSVG
                    value={qrData.qr}
                    size={220}
                    level="M"
                    imageSettings={{
                      src: BAKONG_LOGO,
                      height: 40,
                      width: 40,
                      excavate: true,
                    }}
                  />
                </div>
                {paid && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white rounded-full p-3 shadow-lg">
                      <CheckCircle2 className="h-16 w-16 text-green-500" />
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="text-3xl font-bold text-slate-800">
                  {formatAmount(qrData.amount, qrData.currency)}
                </p>
                {paid ? (
                  <div className="mt-2 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-semibold text-sm">បានទូទាត់រួចរាល់</span>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-center gap-1.5">
                    <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
                    <span className="text-slate-500 text-sm">រង់ចាំការទូទាត់...</span>
                  </div>
                )}
              </div>

              <div className="w-full bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 mb-1">MD5</p>
                <code className="text-xs font-mono text-slate-600 break-all">{qrData.md5}</code>
              </div>

              <div className="w-full border-t border-slate-100 pt-3 flex items-center justify-center gap-2">
                <img src={BAKONG_LOGO} alt="Bakong" className="h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <span className="text-xs text-slate-400">Secured by Bakong NBC</span>
              </div>
            </div>
          ) : null}
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          សូម Scan QR ដោយប្រើ Bakong App ឬ Banking App
        </p>
      </div>
    </div>
  );
}
