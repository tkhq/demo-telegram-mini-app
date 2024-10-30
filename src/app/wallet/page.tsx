'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import Input from "@/components/input";
import { ArrowLeft } from 'lucide-react'
import { SetStateAction, useEffect, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
// import { TurnkeySigner } from "@turnkey/solana";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import axios from "axios";
import { connect, balance } from "@/web3/web3"

export default function Wallet() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const organizationId = searchParams.get('organizationId');
  const solConnection = connect()
  const [solBalance, setSolBalance] = useState(0);
  const [solAddress, setSolAddress] = useState("");
  const [displaySolAddress, setDisplaySolAddress] = useState("...");
  const [sendAmount, setSendAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [turntCoinBalance, setTurnCoinBalance] = useState(0)

  useEffect(() => {
    async function getAddressAndBalance() {
      try {
        const getAddressResponse = await axios.get("/api/getAddress", { 
          params: {
            organizationId: organizationId
          }
        });

        if(!getAddressResponse.data.address) {
          setDisplaySolAddress("Failed Retrieving TurntCoin Address")
          return
        }

        setSolAddress(getAddressResponse.data.address)
        setDisplaySolAddress(truncateAddress(getAddressResponse.data.address, 16))

        const solBal = await balance(solConnection, getAddressResponse.data.address)
        setSolBalance(solBal / LAMPORTS_PER_SOL)
      } catch (e) {
        setDisplaySolAddress("Failed Retrieving TurntCoin Address")
      }
    }

    getAddressAndBalance()
  }, [])

  function handleBack() {
    const queryParams = new URLSearchParams({
      organizationId: organizationId!,
    }).toString();
    router.push(`/play?${queryParams}`)
  }

  function handleSend() {
    alert("Sent!")
  }

  function handleRedeem() {
    alert("Redeemed!")
  }

  function truncateAddress(address: string, maxLength: number) {
    if (address.length <= maxLength) {
      return address
    }

    const halfLength = Math.floor((maxLength - 3) / 2);
    const beginningAddress = address.slice(0, halfLength);
    const endAddress = address.slice(address.length - halfLength);

    return `${beginningAddress}...${endAddress}`;
  }

  function copyAddress() {
    const prevAddress = displaySolAddress;
    navigator.clipboard.writeText(solAddress);

    setDisplaySolAddress("Address copied!");

    setTimeout(() => {
      setDisplaySolAddress(prevAddress); // Reverts to original text after 1 second
    }, 1000);
  }

  function copyExplorerLink(event: any) {
    let explorerLink = `https://explorer.solana.com/address/${solAddress}?cluster=devnet`;
    navigator.clipboard.writeText(explorerLink);

    const target = event.target as HTMLSpanElement;

    const prevText = target.innerText;

    target.innerText = "Explorer link copied to clipboard!";
    setTimeout(() => {
      target.innerText = prevText; // Reverts to original text after 1 second
    }, 1000);
  }

  function handleLogout() {
    router.push("/auth");
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={handleBack}>
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold flex-grow text-center">TurntCoin Wallet</h1>
        <div className="w-10"></div> {/* This empty div balances the layout */}
      </div>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-center">Devnet Solana Wallet Address</CardTitle>
          <div className="text-center cursor-pointer hover:text-gray-400">
            <span onClick={copyExplorerLink}>🔗</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-center break-all cursor-pointer hover:text-gray-400" onClick={copyAddress}>{displaySolAddress}</p>
          <p className="text-center font-semibold">Devnet Sol Balance: {solBalance} ◎</p>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg text-center">Redeem TurntCoins</CardTitle>
          <p className="text-center">100🔑 = 0.001 devnet sol!</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-xl font-semibold">Balance: {turntCoinBalance} 🔑</p>
            <button onClick={handleRedeem} className="font-semibold px-4 h-10 bg-foreground text-background border-solid border-input border rounded-md hover:bg-gray-800">Redeem</button>
          </div>
        </CardContent>
      </Card>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg text-center">Send Devnet Solana</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Recipient Address"
              value={recipientAddress}
              onChange={(e: { target: { value: SetStateAction<string>; }; }) => setRecipientAddress(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Amount"
              value={sendAmount}
              onChange={(e: { target: { value: SetStateAction<string>; }; }) => setSendAmount(e.target.value)}
              step=".1"
            />
            <button onClick={handleSend} className="font-semibold px-4 bg-foreground text-background border-solid border-input border rounded-md hover:bg-gray-800">Send</button>
          </div>
        </CardContent>
      </Card>
      <button onClick={handleLogout} className="w-full">
        <Card className="bg-red-400 mb-4 hover:bg-red-500">
            <CardTitle className="text-lg text-center py-2">Logout</CardTitle>
        </Card>
      </button>
    </div>
  );
}
