export const tgHaptic = {
  impact: (style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light") => {
    try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style); } catch {}
  },
  success: () => {
    try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success"); } catch {}
  },
  error: () => {
    try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("error"); } catch {}
  },
  warning: () => {
    try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("warning"); } catch {}
  },
  selection: () => {
    try { window.Telegram?.WebApp?.HapticFeedback?.selectionChanged(); } catch {}
  },
};
