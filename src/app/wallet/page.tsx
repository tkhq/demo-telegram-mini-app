'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import Input from "@/components/input";
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { TurnkeyBrowserClient } from "@turnkey/sdk-browser"
import { TurnkeySigner } from "@turnkey/solana";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import axios from "axios";
import { connect, balance, transfer, broadcast } from "@/web3/web3"
import { useForm } from "react-hook-form";
import TelegramCloudStorageStamper, { TTelegramCloudStorageStamperConfig } from "@turnkey/telegram-cloud-storage-stamper";
import Link from "next/link";

type SendSolData = {
  amount: number;
  recipient: string;
}

export default function Wallet() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const organizationId = searchParams.get('organizationId');
  const solConnection = connect();
  const [solBalance, setSolBalance] = useState(0);
  const [solAddress, setSolAddress] = useState("");
  const [displaySolAddress, setDisplaySolAddress] = useState("...");
  const [turntCoinBalance, setTurnCoinBalance] = useState(0);
  const [signer, setSigner] = useState<TurnkeySigner | null>(null);
  const [sendErrorText, setSendErrorText] = useState("");
  const [sendSuccessLink, setSendSuccessLink] = useState("");
  const [redeemErrorText, setRedeemErrorText] = useState("");
  const [redeemSuccessLink, setredeemSuccessLink] = useState("");

  const { register: sendSolFormRegister, handleSubmit: sendSolFormSubmit } =
    useForm<SendSolData>();

  useEffect(() => {
    async function init() {
      try {
        // This uses credentials previously stored in Telegram Cloud Storage
        const telegramStamper = await TelegramCloudStorageStamper.create();
        const client = new TurnkeyBrowserClient({
          stamper: telegramStamper,
          organizationId: organizationId!,
          apiBaseUrl: process.env.NEXT_PUBLIC_BASE_URL!
        });
        const turnkeySigner = new TurnkeySigner({
          organizationId: organizationId!,
          client
        })
        setSigner(turnkeySigner)

        const getAddressResponse = await axios.get("/api/getAddress", { 
          params: {
            organizationId: organizationId
          }
        });

        if(!getAddressResponse.data.address) {
          setDisplaySolAddress("Failed Retrieving TurntCoin Address")
          return;
        }

        setSolAddress(getAddressResponse.data.address);
        setDisplaySolAddress(truncateAddress(getAddressResponse.data.address, 16));

        const solBal = await balance(solConnection, getAddressResponse.data.address);
        setSolBalance(solBal / LAMPORTS_PER_SOL);
      } catch (e) {
        setDisplaySolAddress("Failed Retrieving TurntCoin Address");
      }
    }

    init();
  }, [])

  function handleBack() {
    const queryParams = new URLSearchParams({
      organizationId: organizationId!,
    }).toString();
    router.push(`/play?${queryParams}`);
  }

  async function handleSend(data: SendSolData) {
    if (!data.amount || !data.recipient) {
      setSendErrorText("Please enter both an amount and recipient");
      setSendSuccessLink("");
      return;
    }

    const amount = data.amount * LAMPORTS_PER_SOL;

    if (amount >= solBalance * LAMPORTS_PER_SOL) {
      setSendErrorText("Insufficient balance");
      setSendSuccessLink("");
      return;
    }

    const transaction = await transfer(solConnection, amount, solAddress, data.recipient);

    await signer!.addSignature(transaction, solAddress);
    // broadcast
    const transactionHash = await broadcast(solConnection, transaction);
    setSendErrorText("");
    setSendSuccessLink(`https://explorer.solana.com/tx/${transactionHash}?cluster=devnet`);
  }

  async function handleRedeem() {
    try {
      const queryParams = new URLSearchParams({
        organizationId: organizationId!,
      }).toString();
      const getAddressResponse = await axios.post(`/api/redeem?${queryParams}`, { 
        params: {
          organizationId: organizationId
        }
      });

      setRedeemErrorText("");
      setredeemSuccessLink(`https://explorer.solana.com/tx/${getAddressResponse.data.transaction}?cluster=devnet`);
      return;
    } catch (e) {
      setRedeemErrorText("Failed redeeming TurntCoins");
      setredeemSuccessLink("");
    }
  }

  function truncateAddress(address: string, maxLength: number) {
    if (address.length <= maxLength) {
      return address;
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
          {redeemErrorText &&
            <p className="text-red-600 text-center">{redeemErrorText}</p>
          }
          {redeemSuccessLink &&
            <div className="text-center">
              <Link href={redeemSuccessLink} target="_blank" className="text-center hover:underline" onClick={() => {setSendSuccessLink("")}}>Click to navigate to explorer in another tab</Link>
            </div>
          }
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
          {sendErrorText &&
            <p className="text-red-600 text-center">{sendErrorText}</p>
          }
          {sendSuccessLink &&
            <div className="text-center">
              <Link href={sendSuccessLink} target="_blank" className="text-center hover:underline" onClick={() => {setSendSuccessLink("")}}>Click to navigate to explorer in another tab</Link>
            </div>
          }
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Recipient Address"
              {...sendSolFormRegister('recipient')}
            />
            <Input
              type="number"
              placeholder="Amount"
              {...sendSolFormRegister('amount')}
              step=".1"
            />
            <button onClick={sendSolFormSubmit(handleSend)} className="font-semibold px-4 bg-foreground text-background border-solid border-input border rounded-md hover:bg-gray-800">Send</button>
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
