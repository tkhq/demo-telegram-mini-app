'use client'

import Auth from "./auth/page";
import DisplayTelegramMessage from "./display-telegram/page";

export default function Home() {
  return typeof window !== "undefined" && window.Telegram?.WebApp?.CloudStorage ? (
    <Auth/>
  ) : (
    <DisplayTelegramMessage />
  )
}