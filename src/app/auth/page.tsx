'use client'

import { CardContent, CardHeader } from "@/components/card"
import  Input from "@/components/input"
import GoogleAuth from "@/components/google-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Email } from '@/types/types';
import axios from "axios";
import { generateP256KeyPair } from "@turnkey/crypto";
import { MILLIS_15_MINUTES, setLocalStorageItemWithExipry, TURNKEY_EMBEDDED_KEY } from "@/util/util";
import { useEffect, useState } from "react";
import Image from "next/image";

type EmailAuthData = {
  email: Email
}

export default function Auth() {
  const router = useRouter();
  const searchParms = useSearchParams();
  const [errorText, setErrorText] = useState(searchParms.get('error') || "");
  const [continueButtonDisabled, setContinueButtonDisabled] = useState(false);
  const [tgContext, setTGContext] = useState("");
  const { register: emailFormRegister, handleSubmit: emailFormSubmit } =
    useForm<EmailAuthData>();


  useEffect(() => {
    const script = document.querySelector<HTMLScriptElement>('script[src="https://telegram.org/js/telegram-web-app.js"]');
    console.log("OkKkK")
    console.log(script)
    if (script) {
      script.onload = () => {
        console.log("Test")
        console.log(window.Telegram.WebApp.platform)
        setTGContext(window.Telegram.WebApp.platform)
      };
    }

    if(window?.Telegram?.WebApp?.platform) {
      setTGContext(window?.Telegram?.WebApp?.platform)
    }
  }, [])
  
  async function handleEmailLogin (data: EmailAuthData) {
    setContinueButtonDisabled(true);
    const keyPair = generateP256KeyPair();

    try {
      const response = await axios.post("/api/auth", {
        type: "email",
        email: data.email,
        targetPublicKey: keyPair.publicKeyUncompressed,
      });

      // ToDo: store temp key in telegram cloud storage instead of localstorage :eyes:

      if (response.status == 200) {
        setLocalStorageItemWithExipry(TURNKEY_EMBEDDED_KEY, keyPair.privateKey, MILLIS_15_MINUTES)

        const queryParams = new URLSearchParams({
          organizationId: response.data.organizationId,
        }).toString();
        router.push(`/email-auth?${queryParams}`)
      }
    } catch (e) {
      setErrorText("Failed initiating email authentication");
      setContinueButtonDisabled(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md items-center justify-center">
        <CardHeader className="justify-center items-center gap-1 self-stretch pt-8 pb-[21px] px-6">
          <Image
            src="/turnkey.svg"
            alt="Turnkey Logo"
            height={127.622}
            width={127.622}
            className="justify-center items-center flex"
          />
          <p className="text-center text-sm">
            Log in or Sign up
          </p>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center gap-1.5 self-stretch pt-0 pb-8 px-6">
          <form className="space-y-2 w-full">
            {errorText &&
              <p className="text-red-600 text-center flex justify-center items-center w-full text-sm">{errorText}</p>
            }
            <Input
              type="email"
              placeholder="Enter your email"
              {...emailFormRegister('email')}
              className="border-[color:var(--Greyscale-200,#D8DBE3)] shadow-[0px_1px_2px_0px_rgba(14,13,82,0.05)] px-4 py-3.5 border-solid text-foreground w-full rounded"
            />
            <button onClick={emailFormSubmit(handleEmailLogin)} disabled={continueButtonDisabled} className="flex justify-center items-center gap-2 self-stretch border border-[color:var(--Greyscale-800,#3F464B)] px-4 py-2.5 rounded border-solid bg-foreground text-white text-sm w-full">
              Continue with email
            </button>
          </form>
          {
            tgContext === "tdesktop" &&
            <>
              <div className="flex items-center gap-2 py-4 w-full">
                <span className="flex-grow border-t h-px"></span>
                <div className="px-2 text-xs uppercase text-[color:var(--Greyscale-500,#868C95)] font-medium">
                  Or
                </div>
                <span className="flex-grow border-t h-px"></span>
              </div>
              <div>
                <GoogleAuth />
              </div>
            </>
          }
        </CardContent>
      </div>
    </div>
  )
}