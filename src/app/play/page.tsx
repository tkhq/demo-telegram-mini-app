'use client'

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Wallet as LucideWallet } from "lucide-react";

export default function Play() {
  const router = useRouter()
  const [rotation, setRotation] = useState(0);
  const [turntCoinBalance, setTurntCoinBalance] = useState(0);

  function rotate() {
    let newRotation = rotation + 18
    setRotation(newRotation);
    setTurntCoinBalance(turntCoinBalance + 5)

    if(newRotation % 360 == 0) {
    }
  }

  function navigateWallet() {
    router.push(`/wallet`)
  }

  return (
    <div className="min-h-screen bg-forground text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl text-foreground font-bold mb-4 text-center">Welcome to TurntCoin 🔑</h1>
        <div className="text-lg text-foreground text-center mb-8">
            Click to rotate the Turnkey keyhole to get TurntCoins redeemable for devnet Solana!
        </div>
    <div className="flex items-center relative mb-8 cursor-pointer"
         onClick={rotate}>
      <Image
        src="/turnkey.png"
        alt="Turnkey Logo"
        className="rounded-lg transition-transform duration-500 ease-in-out"
        style={{ transform: `rotate(${rotation}deg)` }}
        height={300}
        width={169}
      />
    </div>
    <div className="text-xl font-semibold text-foreground flex cursor-pointer gap-4" onClick={navigateWallet}>
      <LucideWallet/> 
      <div>{turntCoinBalance}</div>
      <div>🔑</div>
    </div>
  </div>
  )
}