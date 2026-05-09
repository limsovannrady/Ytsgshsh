import { useEffect, useState } from "react";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        ready: () => void;
        expand: () => void;
        enableClosingConfirmation: () => void;
      };
    };
  }
}

interface Props {
  children: React.ReactNode;
}

export function TelegramGate({ children }: Props) {
  const [isInTelegram, setIsInTelegram] = useState<boolean | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg && tg.initData) {
      tg.ready();
      tg.expand();
      setIsInTelegram(true);
    } else {
      setIsInTelegram(false);
    }
  }, []);

  if (isInTelegram === null) {
    return null;
  }

  if (!isInTelegram) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-6">
          <svg
            width="80"
            height="80"
            viewBox="0 0 240 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="120" cy="120" r="120" fill="#27A7E5" />
            <path
              d="M180 75L155 165C153.4 171.2 149.6 172.8 144.4 169.8L117.4 149.8L104.4 162.2C102.8 163.8 101.4 165.2 98.4 165.2L100.4 137.6L151.6 90.8C153.8 88.8 151.2 87.6 148.2 89.6L84.4 130.4L57.8 122.2C51.8 120.2 51.6 116.2 59.2 113L172.6 68.4C177.6 66.4 182 69.4 180 75Z"
              fill="white"
            />
          </svg>
        </div>
        <h1 className="text-white text-2xl font-bold mb-3">
          Bakong KHQR Payment
        </h1>
        <p className="text-gray-400 text-base leading-relaxed mb-2">
          កម្មវិធីនេះត្រូវបើកតែនៅក្នុង Telegram Mini App ប៉ុណ្ណោះ
        </p>
        <p className="text-gray-500 text-sm">
          This app can only be used inside Telegram
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
