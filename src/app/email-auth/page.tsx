'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/card"
import Input from "@/components/input"
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation"
import { getLocalStorageItemWithExipry, getPublicKeyFromPrivateKeyHex, TURNKEY_EMBEDDED_KEY } from "@/util/util";
import { decryptCredentialBundle } from "@turnkey/crypto";
import { TelegramCloudStorageStamper } from "@turnkey/telegram-cloud-storage-stamper";
import { useState } from "react";

type EmailAuthCodeData = {
  authCode: string;
}

export default function EmailAuth() {
  const router = useRouter()
  const [errorText, setErrorText] = useState("");
  const [continueButtonDisabled, setContinueButtonDisabled] = useState(false)
  const [returnLoginButtonDisabled, setReturnLoginButtonDisabled] = useState(false)
  const searchParams = useSearchParams();
  const organizationId = searchParams.get('organizationId');
  const { register: emailAuthCodeFormRegister, handleSubmit: emailAuthCodeFormSubmit } =
    useForm<EmailAuthCodeData>();

  const handleEmailAuth = async (data: EmailAuthCodeData) => {
    setContinueButtonDisabled(true)
    setReturnLoginButtonDisabled(true);
    // Handle authentication code verification logic here
    if (!data.authCode) {
      setErrorText("Invalid verification code");
      setContinueButtonDisabled(false);
      setReturnLoginButtonDisabled(false);
    }

    let decryptedData;
    try {
      const embeddedKey = getLocalStorageItemWithExipry(TURNKEY_EMBEDDED_KEY);
      decryptedData = decryptCredentialBundle(
        data.authCode,
        embeddedKey
      );

      if (!decryptedData) {
        setErrorText("Invalid verification code");
        setContinueButtonDisabled(false);
        setReturnLoginButtonDisabled(false);
      }
  
      // This stores the api credentials obtained from email auth into telegram cloud storage and those credentials can be used in other places in your application
      await TelegramCloudStorageStamper.create({
        cloudStorageAPIKey: {
          apiPublicKey: getPublicKeyFromPrivateKeyHex(decryptedData!),
          apiPrivateKey: decryptedData!,
        },
      });
      
      router.push(`/wallet?${searchParams}`);
    } catch (e) {
      setErrorText("Invalid verification code");
      setContinueButtonDisabled(false);
      setReturnLoginButtonDisabled(false);
    }
  }

  const handleReturnToLogin = () => {
    setReturnLoginButtonDisabled(true);
    router.push("/auth")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md items-center justify-center">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">Turnkey</CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Confirm your email
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <form className="space-y-2">
              {errorText &&
                <p className="text-red-600 text-center">{errorText}</p>
              }
              <Input
                type="text"
                placeholder="Enter verification code"
                {...emailAuthCodeFormRegister('authCode')}
              />
              <button onClick={emailAuthCodeFormSubmit(handleEmailAuth)} disabled={continueButtonDisabled} className="w-full px-4 h-10 bg-foreground text-white border-solid border-input border rounded-md hover:bg-gray-800">
                Continue
              </button>
            </form>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>
          <button onClick={handleReturnToLogin} disabled={returnLoginButtonDisabled} className="w-full px-4 h-10 bg-white text-foreground border-solid border-input border rounded-md hover:bg-gray-100">
            Return to login
          </button>
        </CardContent>
      </div>
    </div>
  )
}