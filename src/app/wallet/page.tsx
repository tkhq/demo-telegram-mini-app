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
  const [solPrice, setSolPrice] = useState(160.00);
  const [displaySolAddress, setDisplaySolAddress] = useState("...");
  const [demoCoinBalance, setDemoCoinBalance] = useState(0);
  const [signer, setSigner] = useState<TurnkeySigner | null>(null);
  const [sendErrorText, setSendErrorText] = useState("");
  const [sendSuccessLink, setSendSuccessLink] = useState("");
  const [sendSuccessText, setSendSuccessText] = useState("");
  const [redeemErrorText, setRedeemErrorText] = useState("");
  const [redeemSuccessLink, setRedeemSuccessLink] = useState("");
  const [redeemSuccessText, setRedeemSuccessText] = useState("");
  const [disableInputs, setDisableInputs] = useState(false);
  const [updateBalance, setUpdateBalance] = useState(false);


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
          setDisplaySolAddress("Failed Retrieving Demo Address")
          return;
        }

        setSolAddress(getAddressResponse.data.address);
        setDisplaySolAddress(truncateAddress(getAddressResponse.data.address, 16));

        const solBal = await balance(solConnection, getAddressResponse.data.address);
        setSolBalance(solBal / LAMPORTS_PER_SOL);
      } catch (e) {
        setDisplaySolAddress("Failed Retrieving Demo Address");
      }

      try {
        const getSolPrice = await axios.get("/api/getSolPrice");

        if(getSolPrice.data.solPrice) {
          setSolPrice(getSolPrice.data.solPrice)
        }
      } catch (e) {
      }
    }

    init();
  }, [updateBalance])

  function handleBack() {
    setDisableInputs(true);
    const queryParams = new URLSearchParams({
      organizationId: organizationId!,
    }).toString();
    router.push(`/play?${queryParams}`);
  }

  async function handleSend(data: SendSolData) {
    setDisableInputs(true);
    setSendErrorText("");
    setSendSuccessLink("");
    setSendSuccessText("Sending...");
    if (!data.amount || !data.recipient) {
      setSendErrorText("Please enter both an amount and recipient");
      setSendSuccessLink("");
      setSendSuccessText("");
      setDisableInputs(false);
      return;
    }

    const amount = data.amount * LAMPORTS_PER_SOL;

    if (amount >= solBalance * LAMPORTS_PER_SOL) {
      setSendErrorText("Insufficient balance");
      setSendSuccessLink("");
      setSendSuccessText("");
      setDisableInputs(false);
      return;
    }

    let transaction;
    try {
      transaction = await transfer(solConnection, amount, solAddress, data.recipient);
    } catch (e) {
      setSendErrorText("Invalid amount or recipient");
      setSendSuccessLink("");
      setSendSuccessText("");
      setDisableInputs(false);
      return
    }

    try {

      await signer!.addSignature(transaction, solAddress);
      // broadcast
      const transactionHash = await broadcast(solConnection, transaction);
      setSendErrorText("");
      setSendSuccessLink(`https://explorer.solana.com/tx/${transactionHash}?cluster=devnet`);
      setSendSuccessText("Success!! Click to navigate to explorer");
      setUpdateBalance(!updateBalance);
      setDisableInputs(false);
      return;
    } catch (e) {
      setSendErrorText("Error connecting to network or adding signature");
      setSendSuccessLink("");
      setSendSuccessText("");
      setDisableInputs(false);
      return;
    }
  }

  async function handleRedeem() {
    setDisableInputs(true);
    setRedeemSuccessText("Adding funds...");
    setRedeemErrorText("");
    setRedeemSuccessLink("");
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
      setRedeemSuccessLink(`https://explorer.solana.com/tx/${getAddressResponse.data.transaction}?cluster=devnet`);
      setRedeemSuccessText("Success!! Click to navigate to explorer");
      setDisableInputs(false);
      setUpdateBalance(!updateBalance);
      return;
    } catch (e) {
      setRedeemErrorText("Failed redeeming Demo Coins");
      setRedeemSuccessLink("");
      setRedeemSuccessText("");
      setDisableInputs(false);
      return;
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
    setDisableInputs(true);
    router.push("/auth");
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={handleBack} disabled={disableInputs}>
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold flex-grow text-center">Demo Wallet</h1>
        <div className="w-10"></div> {/* This empty div balances the layout */}
      </div>
      <Card className="mb-2">
        <CardHeader>
          <CardTitle className="text-center">${(solPrice * solBalance).toFixed(2)} USD</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-center break-all cursor-pointer hover:text-gray-400 font-semibold" onClick={copyAddress}>{displaySolAddress}</p>
          <p className="text-center ">{solBalance} SOL (Devnet)</p>
        </CardContent>
      </Card>

      <Card className="mb-2">
        <CardHeader>
          <CardTitle className="text-lg text-center">Fund Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            {/* <p className="text-xl font-semibold">Balance: {demoCoinBalance}</p> */}
            <button onClick={handleRedeem} disabled={disableInputs} className="font-semibold mb-2 px-4 h-10 bg-foreground text-background border-solid border-input border rounded-md hover:bg-gray-800">Add funds</button>
          </div>
          {redeemErrorText &&
            <p className="text-red-600 text-center">{redeemErrorText}</p>
          }
          {redeemSuccessText &&
            <div className="text-center">
              {redeemSuccessLink ? 
                <Link href={redeemSuccessLink} target="_blank" className="text-center hover:underline" onClick={() => {
                    setRedeemSuccessLink("")
                    setRedeemSuccessText("")
                  }}>{redeemSuccessText}
                </Link>
              : 
                <p className="text-center">{redeemSuccessText}</p>
              }
            </div>
          }
        </CardContent>
      </Card>
      <Card className="mb-2">
        <CardHeader>
          <CardTitle className="text-lg text-center">Send</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2">
            {sendErrorText &&
              <p className="text-red-600 text-center">{sendErrorText}</p>
            }
            {sendSuccessText &&
              <div className="text-center">
                {sendSuccessLink ? 
                  <Link href={sendSuccessLink} target="_blank" className="text-center hover:underline" onClick={() => {
                      setSendSuccessLink("")
                      setSendSuccessText("")
                    }}>{sendSuccessText}
                  </Link>
                : 
                  <p className="text-center">{sendSuccessText}</p>
                }
              </div>
            }
          </div>
          <div className="flex flex-col space-y-2">
            <Input
              type="text"
              placeholder="Recipient Address"
              {...sendSolFormRegister('recipient')}
            />
            <Input
              type="text"
              placeholder="Amount"
              {...sendSolFormRegister('amount')}
            />
            <button onClick={sendSolFormSubmit(handleSend)} disabled={disableInputs} className="font-semibold h-10 bg-foreground text-background border-solid border-input border rounded-md hover:bg-gray-800">Send</button>
          </div>
        </CardContent>
      </Card>
      <button onClick={handleLogout} disabled={disableInputs} className="w-full">
        <Card className="bg-foreground mb-4">
            <CardTitle className="text-lg text-center text-background py-2">Logout</CardTitle>
        </Card>
      </button>
    </div>
  );
}
