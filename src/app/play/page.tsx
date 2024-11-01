'use client'

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Wallet as LucideWallet } from "lucide-react";

export default function Play() {
  const router = useRouter()
  const searchParams = useSearchParams();
  const organizationId = searchParams.get('organizationId');
  const [rotation, setRotation] = useState(0);
  const [demoCoinBalance, setDemoCoinBalance] = useState(0);

  function rotate() {
    let newRotation = rotation + 18
    setRotation(newRotation);
    setDemoCoinBalance(demoCoinBalance + 5)
  }

  function navigateWallet() {
    const queryParams = new URLSearchParams({
      organizationId: organizationId!,
    }).toString();
    router.push(`/wallet?${queryParams}`)
  }

  function handleBack() {
    const queryParams = new URLSearchParams({
      organizationId: organizationId!,
    }).toString();
    router.push(`/wallet?${queryParams}`);
  }

  return (
    <div className="min-h-screen bg-forground text-white flex flex-col items-center justify-center p-4">
      <button onClick={handleBack}>
        <ArrowLeft className="h-6 w-6" />
      </button>
        <h1 className="text-3xl text-foreground font-bold mb-4 text-center">Turnkey</h1>
        <div className="text-lg text-foreground text-center mb-8">
            Click to rotate the Turnkey keyhole to get demo coins redeemable for devnet Solana!
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
      <div>{demoCoinBalance}</div>
    </div>
  </div>
  )
}