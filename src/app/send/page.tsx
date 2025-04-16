'use client'
import { Card, CardContent, CardHeader } from "@/components/card"
import { balance, broadcast, connect, transfer } from "@/web3/web3";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TurnkeyBrowserClient } from "@turnkey/sdk-browser";
import { TurnkeySigner } from "@turnkey/solana";
import { TelegramCloudStorageStamper } from "@turnkey/telegram-cloud-storage-stamper";
import axios from "axios";
import Image from "next/image";
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import Popup from "@/components/popup";
import { useForm } from "react-hook-form";

type SendSolData = {
  amount: number | undefined;
  recipient: string;
}

export default function Send() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const organizationId = searchParams.get('organizationId');
  const solConnection = connect();

  const [solAddress, setSolAddress] = useState("");
  const [solBalance, setSolBalance] = useState(0);
  const [signer, setSigner] = useState<TurnkeySigner | null>(null);
  const [updateBalance, setUpdateBalance] = useState(false);
  const [disableInputs, setDisableInputs] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState<"info" | "success" | "error">("info");
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");

  const { register: sendSolFormRegister, handleSubmit: sendSolFormSubmit, setValue } =
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
          return;
        }

        setSolAddress(getAddressResponse.data.address)
        const solBal = await balance(solConnection, getAddressResponse.data.address);
        setSolBalance(solBal / LAMPORTS_PER_SOL);
      } catch (e) {
      }
    }

    init();
  }, [updateBalance]);

  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => {
        setShowPopup(false)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [showPopup])

  useEffect(() => {
    setValue('recipient', "NSsbwsQ4K6rvsAMZJeLoh1LUxBWUaG2NhQ2RimVuFRa");
  }, [])

  function handleBack() {
    const queryParams = new URLSearchParams({
      organizationId: organizationId!,
    }).toString();
    router.push(`/wallet?${queryParams}`);
  }

  function setErrorPopup(title: string, message: string) {
    setShowPopup(false)
    setShowPopup(true)
    setPopupMessage(message);
    setPopupTitle(title);
    setPopupType("error");
  }

  function setInfoPopup(title: string, message: string) {
    setShowPopup(false)
    setShowPopup(true)
    setPopupMessage(message);
    setPopupTitle(title);
    setPopupType("info");
  }

  function setSuccessPopup(title: string, message: string) {
    setShowPopup(false)
    setShowPopup(true)
    setPopupMessage(message);
    setPopupTitle(title);
    setPopupType("success");
  }

  async function handleSend(data: SendSolData) {
    setDisableInputs(true);
    setInfoPopup("Sending transaction", "Please wait...");
    if (!data.amount) {
      setErrorPopup("Failed sending transaction", "Please enter an amount");
      setDisableInputs(false);
      return;
    }

    if (!data.recipient) {
      setErrorPopup("Failed sending transaction", "Please enter a recipient");
      setDisableInputs(false);
      return;
    }

    const amount = data.amount * LAMPORTS_PER_SOL;
    if (amount >= solBalance * LAMPORTS_PER_SOL) {
      setErrorPopup("Failed sending transaction", "Insufficient balance");
      setDisableInputs(false);
      return;
    }

    let transaction;
    try {
      transaction = await transfer(solConnection, amount, solAddress, data.recipient);
    } catch (e) {
      setErrorPopup("Failed sending transaction", "Invalid amount or recipient");
      setDisableInputs(false);
      return
    }

    try {

      await signer!.addSignature(transaction, solAddress);
      // broadcast
      const transactionHash = await broadcast(solConnection, transaction);
      setSuccessPopup("Successfully Sent", `${data.amount} SOL has been sent`);
      setUpdateBalance(!updateBalance);
      clearForm();
      setDisableInputs(false);
      return;
    } catch (e) {
      setErrorPopup("Transaction failed","Error connecting to network or adding signature");
      setDisableInputs(false);
      return;
    }
  }

  function clearForm() {
    setValue("amount", undefined);
    setValue("recipient", "");
  }

  return (
    <div className="relative h-screen">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <button className="rounded-full" onClick={handleBack} disabled={disableInputs}>
            <Image
              src="/back.svg"
              alt="Back button"
              height={60}
              width={60}
            />
          </button>
          <div className="absolute inset-x-0 top-4 flex items-center justify-center gap-2">
            <span className="text-sm">Powered by</span>
            <Image
              src="/turnkey.svg"
              alt="Turnkey Logo"
              height={12}
              width={60}
            />
          </div>
        </div>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-6">
        <Card className="shadow-[0px_2px_6px_0px_rgba(0,0,0,0.08)] rounded-lg bg-white">
          <CardHeader>
            <div className="flex items-center">
              <h1 className="text-3xl font-semibold">Send</h1>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <form>
              <div className="space-x-2">
                <input {...sendSolFormRegister('amount')} className="text-5xl not-italic font-normal leading-[110%] tracking-[-2.3px] border-0 p-0 bg-transparent inline w-[50%] focus:outline-none focus:ring-0" type="text" placeholder="0.00" maxLength={5}/> SOL
                <span className="text-[color:var(--Greyscale-700,#555B64)]">(Devnet)</span>
              </div>
              <p className="text-[color:var(--Greyscale-700,#555B64)] pb-5">BAL {solBalance || "0.00"} SOL</p>
              <input placeholder="Recipient address" disabled={disableInputs} {...sendSolFormRegister('recipient')} className="flex w-full items-center rounded border border-[color:var(--Greyscale-200,#D8DBE3)] shadow-[0px_1px_2px_0px_rgba(14,13,82,0.05)] px-4 py-2.5 border-solid bg-background text-sm"/>
              <button onClick={sendSolFormSubmit(handleSend)} disabled={disableInputs} className="flex w-full justify-center items-center border border-[color:var(--Greyscale-800,#3F464B)] px-4 py-2.5 rounded-lg border-solid bg-foreground text-white mt-2">
                <Image
                  src="/up.svg"
                  alt="Send Logo"
                  height={16}
                  width={16}
                />
                Send
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
      {showPopup && (
        <Popup
          type={popupType}
          title={popupTitle}
          message={popupMessage}
          className="w-full"
        />
      )}
    </div>
  )
}