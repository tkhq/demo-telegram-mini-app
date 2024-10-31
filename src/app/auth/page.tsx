'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/card"
import  Input from "@/components/input"
import GoogleAuth from "@/components/google-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Email } from '@/types/types';
import axios from "axios";
import { generateP256KeyPair } from "@turnkey/crypto";
import { MILLIS_15_MINUTES, setLocalStorageItemWithExipry, TURNKEY_EMBEDDED_KEY } from "@/util/util";
import { useState } from "react";

type EmailAuthData = {
  email: Email
}

export default function Auth() {
  const router = useRouter();
  const searchParms = useSearchParams();
  const [errorText, setErrorText] = useState(searchParms.get('error') || "");
  const { register: emailFormRegister, handleSubmit: emailFormSubmit } =
    useForm<EmailAuthData>();

  async function handleEmailLogin (data: EmailAuthData) {
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
    }
  }

  return (
    <div className="min-h-screen bg-foreground flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-background">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">TurntCoin 🔑 out of ideas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <form className="space-y-2">
              {errorText &&
                <p className="text-red-600 text-center">{errorText}</p>
              }
              <Input
                type="email"
                placeholder="Enter your email"
                {...emailFormRegister('email')}
              />
              <button onClick={emailFormSubmit(handleEmailLogin)} className="w-full px-4 h-10 bg-foreground text-background border-solid border-input border rounded-md hover:bg-gray-800">
                Continue with Email
              </button>
            </form>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <div>
            <GoogleAuth />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}