'use client'
import { Copy } from 'lucide-react'
import { Card, CardContent, CardHeader } from "@/components/card"
import Image from "next/image";
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Receive() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const organizationId = searchParams.get('organizationId');
  const [displaySolAddress, setDisplaySolAddress] = useState("...");
  const [solAddress, setSolAddress] = useState("");
  const failedRetreivingAddressText = "Failed Retrieving Address";


  useEffect(() => {
    async function init() {
      try {
        const getAddressResponse = await axios.get("/api/getAddress", { 
          params: {
            organizationId: organizationId
          }
        });

        if(!getAddressResponse.data.address) {
          setDisplaySolAddress(failedRetreivingAddressText)
          return;
        }

        setSolAddress(getAddressResponse.data.address);
        setDisplaySolAddress(truncateAddress(getAddressResponse.data.address, 32));
      } catch (e) {
        setDisplaySolAddress(failedRetreivingAddressText);
      }
    }
    init();
  }, [])

  function handleBack() {
    const queryParams = new URLSearchParams({
      organizationId: organizationId!,
    }).toString();
    router.push(`/wallet?${queryParams}`);
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
    if (displaySolAddress == failedRetreivingAddressText) {
      return;
    }
    const prevAddress = displaySolAddress;
    navigator.clipboard.writeText(solAddress);

    setDisplaySolAddress("Address copied!");

    setTimeout(() => {
      setDisplaySolAddress(prevAddress); // Reverts to original text after 1 second
    }, 1000);
  }

  return (
    <div className="relative h-screen">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <button className="rounded-full" onClick={handleBack}>
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 w-full">
        <Card className="shadow-[0px_2px_6px_0px_rgba(0,0,0,0.08)] rounded-lg bg-white">
          <CardHeader>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">Receive</h1>
              <p className="text-sm text-muted-foreground">On Solana Devnet</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Card className="flex items-center justify-between space-x-4 p-3 rounded border border-[color:var(--Greyscale-200,#D8DBE3)] shadow-[0px_1px_2px_0px_rgba(14,13,82,0.05)] border-solid bg-background">
              <p className="text-xs whitespace-nowrap font-mono">{displaySolAddress}</p>
              <button onClick={copyAddress} className="h-8 w-8">
                <Copy className="h-4 w-4" />
              </button>
            </Card>
            <Card className="bg-white text-center text-xs text-muted-foreground rounded p-2">
              <p>This address can only receive devnet Solana.</p>
              <p>Sending any other asset to this will result in loss of funds.</p>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}