'use client'

import { useEffect } from "react";
import Auth from "./auth/page";
import { TelegramCloudStorageStamper } from "@turnkey/telegram-cloud-storage-stamper";
import { TurnkeyClient } from "@turnkey/http";
import { useRouter } from "next/navigation";

export default function Home() {
  let router = useRouter();
  
  useEffect(() => {
    async function checkSession() {
      try {
        // Check if there are credentials stored in Telegram Cloud Storage
        const telegramStamper = await TelegramCloudStorageStamper.create();
        const client = new TurnkeyClient(
          { baseUrl: process.env.NEXT_PUBLIC_BASE_URL! },
          telegramStamper,
        );

        // perform a getWhoami to get the sub organization ID for the corresponding public key
        const getWhoAmIResponse = await client.getWhoami({
          organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!
        });
        
        // if there is a successful response then use that session to sign in
        if(getWhoAmIResponse.organizationId) {
          const queryParams = new URLSearchParams({
            organizationId: getWhoAmIResponse.organizationId
          }).toString();
          router.push(`/wallet?${queryParams}`);
        }
      } catch (e) {
      }
    }

    checkSession();
  }, []);

  return (
    <Auth/>
  )
}