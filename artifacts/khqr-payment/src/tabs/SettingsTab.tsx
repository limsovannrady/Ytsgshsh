import { useState, useRef } from "react";
import { Loader2, Save, Eye, EyeOff, Copy, Check, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGetSettings, useSaveSettings } from "@workspace/api-client-react";
import { useTelegramUser } from "@/TelegramContext";
import QRCode from "react-qr-code";

const FIELDS = [
  {
    key: "MERCHANT_NAME",
    label: "ឈ្មោះហាង (Merchant Name)",
    placeholder: "Lim Sovannrady",
    sensitive: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    key: "BAKONG_ACCOUNT_ID",
    label: "គណនីធនាគារ (Bakong Account)",
    placeholder: "yourname@aclb",
    sensitive: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
        <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
      </svg>
    ),
  },
  {
    key: "BAKONG_TOKEN",
    label: "Bakong Token (rbk_...)",
    placeholder: "rbk_...",
    sensitive: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>
    ),
  },
];

function getLogoDisplayName(logoData: string): string {
  if (!logoData) return "";
  if (logoData.startsWith("data:")) return "logo_uploaded.jpg";
  return logoData.slice(0, 28) + "...";
}

/* ─── KHQR Preview Card ──────────────────────────────────────────────────── */
function KhqrPreviewCard({
  merchantName,
  accountId,
  logo,
}: {
  merchantName: string;
  accountId: string;
  logo: string | null;
}) {
  const sampleQr = accountId
    ? `00020101021229${accountId}5204000053031165802KH5925${(merchantName || "MERCHANT").slice(0, 25).padEnd(25)}6010PHNOM PENH6304ABCD`
    : "BAKONG_KHQR_SAMPLE";

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-xl"
      style={{ fontFamily: "'Kantumruy Pro', sans-serif", background: "linear-gradient(145deg, #0a1628 0%, #0d2044 60%, #0a3060 100%)" }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="h-4 w-4">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
          </div>
          <div>
            <p className="text-white/50 text-[9px] font-medium uppercase tracking-widest">Bakong KHQR</p>
            <p className="text-white text-xs font-semibold" style={{ fontFamily: "'Kantumruy Pro', sans-serif" }}>
              {merchantName || "ឈ្មោះហាង"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white/40 text-[9px] uppercase tracking-wider">NBC Certified</p>
          <div className="flex items-center gap-1 justify-end mt-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 text-[9px] font-medium">Active</span>
          </div>
        </div>
      </div>

      {/* QR area */}
      <div className="flex flex-col items-center px-5 py-4 gap-3">
        <div className="relative bg-white rounded-2xl p-3 shadow-2xl">
          <QRCode value={sampleQr} size={160} level="M" />
          {/* Center logo overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-10 w-10 rounded-full bg-white shadow-md border-2 border-white overflow-hidden flex items-center justify-center">
              {logo ? (
                <img src={logo} alt="logo" className="h-full w-full object-cover" />
              ) : (
                <img
                  src="https://bakong.nbc.gov.kh/images/logo.png"
                  alt="Bakong"
                  className="h-8 w-8 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Account info */}
        <div className="text-center space-y-0.5">
          <p
            className="text-white font-semibold text-sm"
            style={{ fontFamily: "'Kantumruy Pro', sans-serif" }}
          >
            {merchantName || "ឈ្មោះអ្នកទទួល"}
          </p>
          <p className="text-white/50 text-[11px] font-mono">
            {accountId || "yourname@bank"}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-white/10" />

      {/* Footer instruction */}
      <div className="px-5 py-3 flex items-center justify-between">
        <p
          className="text-white/40 text-[10px] leading-tight"
          style={{ fontFamily: "'Kantumruy Pro', sans-serif" }}
        >
          ស្កេន QR ដោយប្រើ<br />Bakong / Banking App
        </p>
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded bg-white/10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="h-3 w-3" opacity={0.6}>
              <path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm13 1h2v2h-2zm0 4h2v2h-2zm2-2h2v2h-2zm2 2h2v2h-2zm0-4h2v2h-2zm-2-2h2v2h-2z"/>
            </svg>
          </div>
          <span className="text-white/30 text-[9px] uppercase tracking-wider">Secured by NBC</span>
        </div>
      </div>
    </div>
  );
}

export default function SettingsTab() {
  const { toast } = useToast();
  const tgUser = useTelegramUser();
  const { data } = useGetSettings();
  const saveSettings = useSaveSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<Record<string, string>>({});
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [initialized, setInitialized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  if (data && !initialized) {
    const loaded: Record<string, string> = {};
    for (const f of FIELDS) {
      loaded[f.key] = (data as Record<string, string>)[f.key] ?? "";
    }
    const logoData = (data as Record<string, string>)["LOGO_DATA"] ?? "";
    loaded["LOGO_DATA"] = logoData;
    if (logoData) setLogoPreview(logoData);
    setValues(loaded);
    setInitialized(true);
  }

  const handleCopyId = () => {
    if (!tgUser) return;
    navigator.clipboard.writeText(String(tgUser.id)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast({ title: "រូបភាព​ធំ​ពេក", description: "សូមជ្រើសរើសរូបភាពតូចជាង 500KB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setLogoPreview(base64);
      setValues((v) => ({ ...v, LOGO_DATA: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    saveSettings.mutate(
      { data: values },
      {
        onSuccess: () => toast({ title: "រក្សាទុករួចរាល់!", description: "ការកំណត់ត្រូវបានរក្សាទុក។" }),
        onError: () => toast({ title: "Error", description: "មិនអាចរក្សាទុកបានទេ។", variant: "destructive" }),
      }
    );
  };

  const displayName = tgUser
    ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ")
    : "Telegram User";

  return (
    <div className="p-4 space-y-4" style={{ fontFamily: "'Kantumruy Pro', sans-serif" }}>

      {/* ─── Profile Card ─── */}
      <div className="bg-card rounded-2xl border shadow-sm p-5 flex flex-col items-center gap-3">
        {tgUser?.photo_url ? (
          <img src={tgUser.photo_url} alt="avatar" className="h-20 w-20 rounded-full object-cover ring-4 ring-primary/20" />
        ) : (
          <div className="h-20 w-20 rounded-full flex items-center justify-center text-white text-2xl font-bold ring-4 ring-primary/20" style={{ background: "hsl(211,100%,42%)" }}>
            {displayName[0]?.toUpperCase() ?? "T"}
          </div>
        )}
        <div className="text-center space-y-1">
          <p className="text-lg font-bold text-foreground" style={{ fontFamily: "'Kantumruy Pro', sans-serif" }}>{displayName}</p>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.68 7.93c-.12.57-.46.71-.93.44l-2.57-1.89-1.24 1.19c-.14.14-.25.25-.51.25l.18-2.6 4.72-4.26c.2-.18-.05-.28-.32-.1L7.4 14.53 4.87 13.7c-.56-.17-.57-.56.12-.83l9.07-3.49c.47-.17.88.12.72.83l-.14-.51z"/>
            </svg>
            <span style={{ fontFamily: "'Kantumruy Pro', sans-serif" }}>អ្នកប្រើប្រាស់ទូទៅ</span>
          </span>
        </div>
        {tgUser && (
          <button
            onClick={handleCopyId}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-sm text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-[#27A7E5]">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.68 7.93c-.12.57-.46.71-.93.44l-2.57-1.89-1.24 1.19c-.14.14-.25.25-.51.25l.18-2.6 4.72-4.26c.2-.18-.05-.28-.32-.1L7.4 14.53 4.87 13.7c-.56-.17-.57-.56.12-.83l9.07-3.49c.47-.17.88.12.72.83l-.14-.51z"/>
            </svg>
            <span className="font-mono font-medium">{tgUser.id}</span>
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {/* ─── KHQR Preview ─── */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground px-1 flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            <path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01M17 20h.01M20 14h.01M20 17h.01M20 20h.01"/>
          </svg>
          គំរូ KHQR របស់អ្នក
        </p>
        <KhqrPreviewCard
          merchantName={values["MERCHANT_NAME"] ?? ""}
          accountId={values["BAKONG_ACCOUNT_ID"] ?? ""}
          logo={logoPreview}
        />
      </div>

      {/* ─── Settings Form ─── */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-blue-50/60">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-blue-600">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
          <span className="text-sm font-semibold text-blue-600" style={{ fontFamily: "'Kantumruy Pro', sans-serif" }}>ការកំណត់គណនីរបស់អ្នក</span>
        </div>

        <div className="p-4 space-y-4">

          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground" style={{ fontFamily: "'Kantumruy Pro', sans-serif" }}>
                <span className="text-muted-foreground/70">{f.icon}</span>
                {f.label}
              </label>
              <div className="relative">
                <input
                  type={f.sensitive && !shown[f.key] ? "password" : "text"}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 pr-10 transition-shadow"
                  style={{ fontFamily: "'Kantumruy Pro', sans-serif" }}
                />
                {f.sensitive && (
                  <button
                    type="button"
                    onClick={() => setShown((s) => ({ ...s, [f.key]: !s[f.key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {shown[f.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Logo upload field */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground" style={{ fontFamily: "'Kantumruy Pro', sans-serif" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-muted-foreground/70">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              រូបភណ្ឌ (Logo សម្រាប់ QR)
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-between bg-background border border-border rounded-xl px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
            >
              <span className="text-muted-foreground font-mono text-xs truncate max-w-[80%]">
                {values["LOGO_DATA"]
                  ? getLogoDisplayName(values["LOGO_DATA"])
                  : "ជ្រើសរើសរូបភាព..."}
              </span>
              <span className="flex items-center gap-1.5 text-primary shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="logo" className="h-6 w-6 rounded object-cover" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <p className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Kantumruy Pro', sans-serif" }}>រូបភាព PNG/JPG — អតិបរិមា 500KB</p>
          </div>

        </div>

        <div className="px-4 pb-4">
          <button
            onClick={handleSave}
            disabled={saveSettings.isPending}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60 shadow-sm"
            style={{ background: "hsl(211, 100%, 42%)", fontFamily: "'Kantumruy Pro', sans-serif" }}
          >
            {saveSettings.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> កំពុងរក្សាទុក...</>
            ) : (
              <><Save className="h-4 w-4" /> រក្សាទុក</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
