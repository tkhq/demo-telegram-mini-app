'use client'

import { useEffect } from "react";
import Auth from "./auth/page";
import DisplayTelegramMessage from "./display-telegram/page";
import { useState } from "react";

export default function Home() {
  const [telegramContext, setTelegramContext] = useState(true);
  
  useEffect(() => {
    if(!window.Telegram?.WebApp?.WebAppUser) {
      setTelegramContext(false)
    }
  }, [])

  return (
    telegramContext ? 
      <Auth/> 
    : 
      <DisplayTelegramMessage />
  )
}