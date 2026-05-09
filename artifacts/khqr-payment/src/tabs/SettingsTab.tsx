import { useState, useRef } from "react";
import { Loader2, Save, Eye, EyeOff, Copy, Check, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGetSettings, useSaveSettings } from "@workspace/api-client-react";
import { useTelegramUser } from "@/TelegramContext";

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
    key: "MERCHANT_CITY",
    label: "ក្រុង (City)",
    placeholder: "Phnom Penh",
    sensitive: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
  {
    key: "ACQUIRING_BANK",
    label: "Acquiring Bank (optional)",
    placeholder: "ACLBKHPP",
    sensitive: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
        <path d="M3 21V7l9-4 9 4v14"/><path d="M9 21V11h6v10"/>
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
  if (logoData.startsWith("data:")) {
    return "logo_uploaded.jpg";
  }
  return logoData.slice(0, 28) + "...";
}

export default function SettingsTab() {
  const { toast } = useToast();
  const tgUser = useTelegramUser();
  const { data, isLoading } = useGetSettings();
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
    <div className="p-4 space-y-4">

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
          <p className="text-lg font-bold text-foreground">{displayName}</p>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.68 7.93c-.12.57-.46.71-.93.44l-2.57-1.89-1.24 1.19c-.14.14-.25.25-.51.25l.18-2.6 4.72-4.26c.2-.18-.05-.28-.32-.1L7.4 14.53 4.87 13.7c-.56-.17-.57-.56.12-.83l9.07-3.49c.47-.17.88.12.72.83l-.14-.51z"/>
            </svg>
            អ្នកប្រើប្រាស់ទូទៅ
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

      {/* ─── Settings Form ─── */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-blue-50/60">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-blue-600">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
          <span className="text-sm font-semibold text-blue-600">ការកំណត់គណនីរបស់អ្នក</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="p-4 space-y-4">

            {/* Regular fields */}
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
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
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
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
              <p className="text-[10px] text-muted-foreground">រូបភាព PNG/JPG — អតិបរិមា 500KB</p>
            </div>

          </div>
        )}

        <div className="px-4 pb-4">
          <button
            onClick={handleSave}
            disabled={saveSettings.isPending || isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60 shadow-sm"
            style={{ background: "hsl(211, 100%, 42%)" }}
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
