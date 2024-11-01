'use client'

import { useEffect } from "react";
import Auth from "./auth/page";
import DisplayTelegramMessage from "./display-telegram/page";
import { useState } from "react";

export default function Home() {
  const [telegramContext, setTelegramContext] = useState(true);
  
  useEffect(() => {
    try{
      window.Telegram?.WebApp.CloudStorage.getItem("Test")
    } catch (e) {
      setTelegramContext(false)
    }
  }, [window.Telegram?.WebApp])

  return (
    telegramContext ? 
      <Auth/> 
    : 
      <DisplayTelegramMessage />
  )
}