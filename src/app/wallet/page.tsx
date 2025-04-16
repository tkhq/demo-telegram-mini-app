'use client'

import { Card, CardContent, CardHeader } from "@/components/card";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import axios from "axios";
import { connect, balance } from "@/web3/web3"
import { Copy } from "lucide-react";
import Image from "next/image";
import Popup from "@/components/popup";
import {
  TelegramCloudStorageStamper,
  DEFAULT_TURNKEY_CLOUD_STORAGE_KEY,
} from "@turnkey/telegram-cloud-storage-stamper";

export default function Wallet() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const organizationId = searchParams.get('organizationId');
  const solConnection = connect();
  const failedRetrievingAddressText = "Failed Retrieving Address";
  const [solBalance, setSolBalance] = useState(0);
  const [solAddress, setSolAddress] = useState("");
  const [solPrice, setSolPrice] = useState(200.00);
  const [displaySolAddress, setDisplaySolAddress] = useState("...");
  const [disableInputs, setDisableInputs] = useState(false);
  const [updateBalance, setUpdateBalance] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState<"info" | "success" | "error">("info");
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");

  const TURNKEY_AIRDROPS_NUM_KEY = "TURNKEY_DEMO_AIRDROPS_AMOUNT";

  useEffect(() => {
    async function init() {
      try {
        const getAddressResponse = await axios.get("/api/getAddress", { 
          params: {
            organizationId: organizationId
          }
        });

        if(!getAddressResponse.data.address) {
          setDisplaySolAddress(failedRetrievingAddressText)
          return;
        }

        setSolAddress(getAddressResponse.data.address);
        setDisplaySolAddress(truncateAddress(getAddressResponse.data.address, 16));

        const solBal = await balance(solConnection, getAddressResponse.data.address);
        setSolBalance(solBal / LAMPORTS_PER_SOL);
      } catch (e) {
        setDisplaySolAddress(failedRetrievingAddressText);
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
  }, [updateBalance]);

  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => {
        setShowPopup(false)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [showPopup]);

  async function onAirdrop() {
    setDisableInputs(true);
    setInfoPopup("Adding funds...", "Please wait");
    try {
      const telegramStamper = new TelegramCloudStorageStamper();

      const airdrops = await telegramStamper.getItem(TURNKEY_AIRDROPS_NUM_KEY);
      let numAirdrops = parseInt(airdrops);
      if (isNaN(numAirdrops)) {
        numAirdrops = 0;
      }

      if (numAirdrops >= 5) {
        setErrorPopup("Cannot add funds", "Reached limit of 5 requested funds");
        setDisableInputs(false);
        return;
      }

      const queryParams = new URLSearchParams({
        organizationId: organizationId!,
      }).toString();
      const getAddressResponse = await axios.post(`/api/redeem?${queryParams}`, { 
        params: {
          organizationId: organizationId
        }
      });

      telegramStamper.setItem(TURNKEY_AIRDROPS_NUM_KEY, (numAirdrops + 1).toString())

      setSuccessPopup("Funds added", "Received 0.01 devnet SOL");
      setDisableInputs(false);
      setUpdateBalance(!updateBalance);
      return;
    } catch (e) {
      setErrorPopup("Funds not added", "Please try again");
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

  function onSend() {
    setDisableInputs(true);
    router.push(`/send?${searchParams}`);
  }

  function onReceive() {
    setDisableInputs(true);
    router.push(`/receive?${searchParams}`);
  }

  function onLogout() {
    setDisableInputs(true);
    
    // clear the API Key from Telegram Cloud storage
    const telegramStamper = new TelegramCloudStorageStamper();
    telegramStamper.clearItem(DEFAULT_TURNKEY_CLOUD_STORAGE_KEY);

    router.push("/auth");
  }

  return (
    <div className="relative h-screen bg-background">
      <div className="p-4 min-h-0 flex-grow">
        <div className="space-y-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
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
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-6">
        <Card className="shadow-[0px_2px_6px_0px_rgba(0,0,0,0.08)] rounded-lg bg-white">
          <CardHeader>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">Wallet</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-sm font-mono">{displaySolAddress}</span>
                <button 
                  className="h-8 w-8" 
                  onClick={copyAddress}
                  disabled={disableInputs}
                >
                  {displaySolAddress == failedRetrievingAddressText ? "" : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-1">
              <div className="text-5xl font-bold tracking-tighter">
                ${(solBalance * solPrice).toFixed(2)}
              </div>
              <p className="text-lg text-muted-foreground">
                {solBalance} SOL (Devnet)
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <div className="pt-10">
          <button 
            className="flex w-full justify-center items-center gap-2 border border-[color:var(--Greyscale-800,#3F464B)] px-4 py-2.5 rounded-lg border-solid bg-foreground text-white"
            onClick={onAirdrop}
            disabled={disableInputs}
          >
            <Image
              src="/airdrop.svg"
              alt="Airdrop Sol"
              height={16}
              width={16}
            />
            Add Funds
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            className="flex w-full justify-center items-center gap-2 border border-[color:var(--Greyscale-400,#A2A7AE)] px-4 py-2.5 rounded-lg border-solid bg-white"
            onClick={onSend}
            disabled={disableInputs}
          >
            <Image
              src="/up-black.svg"
              alt="Send Logo"
              height={16}
              width={16}
            />
            Send
          </button>
          <button 
            className="flex w-full justify-center items-center gap-2 border border-[color:var(--Greyscale-400,#A2A7AE)] px-4 py-2.5 rounded-lg border-solid bg-white"
            onClick={onReceive}
            disabled={disableInputs}
          >
            <Image
              src="/down-black.svg"
              alt="Receive Logo"
              height={16}
              width={16}
            />
            Receive
          </button>
        </div>

        <button 
          className="flex w-full justify-center items-center gap-2 border border-[color:var(--Greyscale-800,#3F464B)] px-4 py-2.5 rounded-lg border-solid bg-foreground text-white"
          onClick={onLogout}
          disabled={disableInputs}
        >
          Log out
        </button>
        </div>
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
  );
}
