import { useState } from "react";
import { Loader2, Save, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGetSettings, useSaveSettings } from "@workspace/api-client-react";

const FIELDS = [
  { key: "BAKONG_ACCOUNT_ID", label: "Bakong Account ID", placeholder: "yourname@devit", sensitive: false, hint: "Bakong account ID (ឧ: yourname@devit)" },
  { key: "MERCHANT_NAME", label: "ឈ្មោះអ្នក / ហាង", placeholder: "My Shop", sensitive: false, hint: "ឈ្មោះដែលបង្ហាញនៅលើ QR" },
  { key: "MERCHANT_CITY", label: "ក្រុង", placeholder: "Phnom Penh", sensitive: false, hint: "ក្រុង (ឧ: Phnom Penh, Siem Reap)" },
  { key: "ACQUIRING_BANK", label: "Acquiring Bank (optional)", placeholder: "ACLBKHPP", sensitive: false, hint: "Bank code — ទុកទំនេរប្រសិនបើមិនដឹង" },
  { key: "BAKONG_TOKEN", label: "Bakong API Token (optional)", placeholder: "eyJ...", sensitive: true, hint: "Token សម្រាប់ confirm payment — optional" },
];

export default function SettingsTab() {
  const { toast } = useToast();
  const { data, isLoading } = useGetSettings();
  const saveSettings = useSaveSettings();

  const [values, setValues] = useState<Record<string, string>>({});
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [initialized, setInitialized] = useState(false);

  if (data && !initialized) {
    const loaded: Record<string, string> = {};
    for (const f of FIELDS) {
      loaded[f.key] = (data as Record<string, string>)[f.key] ?? "";
    }
    setValues(loaded);
    setInitialized(true);
  }

  const handleSave = () => {
    saveSettings.mutate(
      { data: values },
      {
        onSuccess: () => toast({ title: "រក្សាទុករួចរាល់!", description: "ការកំណត់ត្រូវបានរក្សាទុក។" }),
        onError: () => toast({ title: "Error", description: "មិនអាចរក្សាទុកបានទេ។", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 pt-2 pb-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5 text-muted-foreground">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
        <span className="text-sm font-semibold text-muted-foreground">ការកំណត់</span>
      </div>

      <div className="bg-card rounded-xl border p-4 space-y-4">
        <p className="text-xs text-muted-foreground">
          ព័ត៌មានខាងក្រោមនឹងត្រូវបានប្រើសម្រាប់បង្កើត KHQR code ដោយស្វ័យប្រវត្តិ។
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-1">
                <label className="text-xs font-medium text-foreground">{f.label}</label>
                <div className="relative">
                  <input
                    type={f.sensitive && !shown[f.key] ? "password" : "text"}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 pr-9"
                  />
                  {f.sensitive && (
                    <button
                      type="button"
                      onClick={() => setShown((s) => ({ ...s, [f.key]: !s[f.key] }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {shown[f.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">{f.hint}</p>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saveSettings.isPending || isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ background: "hsl(var(--primary))" }}
        >
          {saveSettings.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> កំពុងរក្សាទុក...</>
          ) : (
            <><Save className="h-4 w-4" /> រក្សាទុក</>
          )}
        </button>
      </div>
    </div>
  );
}
