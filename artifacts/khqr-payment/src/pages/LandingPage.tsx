import { useLocation } from "wouter";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function LandingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <img src={`${basePath}/logo.svg`} alt="logo" className="h-8 w-8" />
          <span className="font-bold text-base text-foreground">Bakong KHQR</span>
        </div>
        <button
          onClick={() => setLocation("/sign-in")}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
        >
          ចូលគណនី
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8 pb-16">
        <div className="flex flex-col items-center gap-6">
          <div className="h-20 w-20 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "hsl(211, 100%, 42%)" }}>
            <img src={`${basePath}/logo.svg`} alt="logo" className="h-14 w-14" />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-foreground">Bakong KHQR Payment</h1>
            <p className="text-muted-foreground text-base max-w-xs leading-relaxed">
              បង្កើត KHQR code, ទទួលទឹកប្រាក់, និង verify payment ភ្លាមៗ — សម្រាប់ merchant Bakong គ្រប់រូប
            </p>
          </div>
        </div>

        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={() => setLocation("/sign-up")}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: "hsl(211, 100%, 42%)" }}
          >
            ចុះឈ្មោះឥឡូវ
          </button>
          <button
            onClick={() => setLocation("/sign-in")}
            className="w-full py-3.5 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors"
          >
            ចូលគណនី
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 w-full max-w-xs mt-2">
          {[
            { icon: "🔲", label: "បង្កើត KHQR" },
            { icon: "✅", label: "Verify Payment" },
            { icon: "📊", label: "ប្រវត្តិ" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1.5 p-3 bg-card rounded-xl border border-border">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-[11px] font-medium text-muted-foreground text-center leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
