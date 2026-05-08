import { useEffect, useRef, useState } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import GenerateQrTab from "@/tabs/GenerateQrTab";
import CheckPaymentTab from "@/tabs/CheckPaymentTab";
import HistoryTab from "@/tabs/HistoryTab";
import PosTab from "@/tabs/PosTab";
import DocsTab from "@/tabs/DocsTab";
import SettingsTab from "@/tabs/SettingsTab";
import { BottomNav } from "@/components/BottomNav";
import LandingPage from "@/pages/LandingPage";

const queryClient = new QueryClient();

export type TabId = "home" | "check" | "history" | "pos" | "docs" | "settings";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(211, 100%, 42%)",
    colorForeground: "hsl(220, 30%, 12%)",
    colorMutedForeground: "hsl(220, 15%, 50%)",
    colorDanger: "hsl(0, 72%, 51%)",
    colorBackground: "hsl(220, 20%, 96%)",
    colorInput: "hsl(220, 15%, 88%)",
    colorInputForeground: "hsl(220, 30%, 12%)",
    colorNeutral: "hsl(220, 15%, 70%)",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-gray-900 font-bold",
    headerSubtitle: "text-gray-500",
    socialButtonsBlockButtonText: "text-gray-700 font-medium",
    formFieldLabel: "text-gray-700 font-medium",
    footerActionLink: "text-blue-600 font-medium",
    footerActionText: "text-gray-500",
    dividerText: "text-gray-400",
    identityPreviewEditButton: "text-blue-600",
    formFieldSuccessText: "text-green-600",
    alertText: "text-red-600",
    logoBox: "flex justify-center",
    logoImage: "h-12 w-12",
    socialButtonsBlockButton: "border border-gray-200 bg-white hover:bg-gray-50",
    formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-semibold",
    formFieldInput: "bg-gray-50 border border-gray-200 text-gray-900",
    footerAction: "bg-transparent",
    dividerLine: "bg-gray-200",
    alert: "bg-red-50 border border-red-200",
    otpCodeFieldInput: "border border-gray-200 bg-white text-gray-900",
    formFieldRow: "",
    main: "",
  },
};

function Dashboard() {
  const [tab, setTab] = useState<TabId>("home");
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto relative">
      <main className="flex-1 overflow-y-auto pb-20">
        {tab === "home" && <GenerateQrTab />}
        {tab === "check" && <CheckPaymentTab />}
        {tab === "history" && <HistoryTab />}
        {tab === "pos" && <PosTab />}
        {tab === "docs" && <DocsTab />}
        {tab === "settings" && <SettingsTab />}
      </main>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function DashboardRoute() {
  return (
    <>
      <Show when="signed-in">
        <Dashboard />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/dashboard`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/dashboard`}
      />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "ចូលគណនី",
            subtitle: "ចូលដើម្បីប្រើ Bakong KHQR Payment",
          },
        },
        signUp: {
          start: {
            title: "បង្កើតគណនី",
            subtitle: "ចុះឈ្មោះដើម្បីចាប់ផ្ដើមប្រើប្រាស់",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/dashboard" component={DashboardRoute} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route><Redirect to="/" /></Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
