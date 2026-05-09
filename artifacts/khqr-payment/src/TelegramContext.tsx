import { createContext, useContext } from "react";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export const TelegramContext = createContext<TelegramUser | null>(null);

export function useTelegramUser(): TelegramUser | null {
  return useContext(TelegramContext);
}
