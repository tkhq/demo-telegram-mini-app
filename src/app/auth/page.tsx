'use client'

import { CardContent, CardHeader } from "@/components/card"
import Input from "@/components/input"
import GoogleAuth from "@/components/google-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Suspense } from "react";
import { Email } from '@/types/types';
import axios from "axios";
import { generateP256KeyPair, encryptOtpCodeToBundle, fromDerSignature } from "@turnkey/crypto";
import { uint8ArrayToHexString } from "@turnkey/encoding";
import { signWithApiKey, getClientSignatureMessageForLogin } from "@turnkey/core";
import type { v1ClientSignature } from "@turnkey/sdk-types";
import { getPublicKeyFromPrivateKeyHex } from "@/util/util";
import { TelegramCloudStorageStamper } from "@turnkey/telegram-cloud-storage-stamper";
import { useEffect, useState } from "react";
import Image from "next/image";

type EmailFormData = { email: Email }
type OtpFormData = { otpCode: string }

function AuthContent() {
  const router = useRouter();
  const searchParms = useSearchParams();
  const [errorText, setErrorText] = useState(searchParms.get('error') || "");
  const [working, setWorking] = useState(false);
  const [tgContext, setTGContext] = useState("");

  // OTP flow state — P256 key pair lives in React state only, never touches localStorage
  const [email, setEmailState] = useState("");
  const [otpId, setOtpId] = useState<string | null>(null);
  const [otpEncryptionTargetBundle, setOtpEncryptionTargetBundle] = useState<string | null>(null);
  const [keyPair, setKeyPair] = useState<{ privateKey: string; publicKey: string } | null>(null);

  const { register: emailRegister, handleSubmit: emailSubmit } = useForm<EmailFormData>();
  const { register: otpRegister, handleSubmit: otpSubmit } = useForm<OtpFormData>();

  useEffect(() => {
    const script = document.querySelector<HTMLScriptElement>('script[src="https://telegram.org/js/telegram-web-app.js"]');
    if (script) {
      script.onload = () => setTGContext(window.Telegram.WebApp.platform);
    }
    if (window?.Telegram?.WebApp?.platform) {
      setTGContext(window.Telegram.WebApp.platform);
    }
  }, []);

  async function handleSendCode(data: EmailFormData) {
    setWorking(true);
    setErrorText("");
    try {
      const kp = generateP256KeyPair();
      const publicKey = getPublicKeyFromPrivateKeyHex(kp.privateKey);

      const res = await axios.post("/api/auth", {
        type: "email",
        email: data.email,
      });

      setEmailState(data.email);
      setKeyPair({ privateKey: kp.privateKey, publicKey });
      setOtpId(res.data.otpId);
      setOtpEncryptionTargetBundle(res.data.otpEncryptionTargetBundle);
    } catch {
      setErrorText("Failed to send verification code");
    } finally {
      setWorking(false);
    }
  }

  async function handleVerifyOtp(data: OtpFormData) {
    if (!otpId || !keyPair || !otpEncryptionTargetBundle) {
      setErrorText("Missing OTP state — please resend the code.");
      return;
    }
    setWorking(true);
    setErrorText("");
    try {
      // Encrypt OTP code to the enclave's ephemeral key — plaintext never leaves the browser
      const encryptedOtpBundle = await encryptOtpCodeToBundle(
        data.otpCode.trim(),
        otpEncryptionTargetBundle,
        keyPair.publicKey,
      );

      // Step 1: verify OTP → get verificationToken
      const verifyRes = await axios.post("/api/verify-otp", {
        otpId,
        encryptedOtpBundle,
      });
      const { verificationToken } = verifyRes.data;

      // Step 2: build client signature proving we hold the private key
      const { message } = getClientSignatureMessageForLogin({ verificationToken });
      const derSignature = await signWithApiKey({
        content: message,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
      });
      const clientSignature: v1ClientSignature = {
        scheme: "CLIENT_SIGNATURE_SCHEME_API_P256",
        publicKey: keyPair.publicKey,
        message,
        signature: uint8ArrayToHexString(fromDerSignature(derSignature)),
      };

      // Step 3: sub-org lookup/create + otpLogin
      const loginRes = await axios.post("/api/otp-login", {
        email,
        verificationToken,
        publicKey: keyPair.publicKey,
        clientSignature,
      });
      const { organizationId } = loginRes.data;

      // Step 4: persist session key to Telegram Cloud Storage
      await TelegramCloudStorageStamper.create({
        cloudStorageAPIKey: {
          apiPublicKey: keyPair.publicKey,
          apiPrivateKey: keyPair.privateKey,
        },
      });

      router.push(`/wallet?organizationId=${organizationId}`);
    } catch {
      setErrorText("Invalid verification code");
    } finally {
      setWorking(false);
    }
  }

  function handleBack() {
    setOtpId(null);
    setOtpEncryptionTargetBundle(null);
    setKeyPair(null);
    setErrorText("");
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
          <p className="text-center text-sm">Log in or Sign up</p>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center gap-1.5 self-stretch pt-0 pb-8 px-6">
          {!otpId ? (
            <form className="space-y-2 w-full">
              {errorText && (
                <p className="text-red-600 text-center flex justify-center items-center w-full text-sm">{errorText}</p>
              )}
              <Input
                type="email"
                placeholder="Enter your email"
                {...emailRegister('email')}
                className="border-[color:var(--Greyscale-200,#D8DBE3)] shadow-[0px_1px_2px_0px_rgba(14,13,82,0.05)] px-4 py-3.5 border-solid text-foreground w-full rounded"
              />
              <button
                onClick={emailSubmit(handleSendCode)}
                disabled={working}
                className="flex justify-center items-center gap-2 self-stretch border border-[color:var(--Greyscale-800,#3F464B)] px-4 py-2.5 rounded border-solid bg-foreground text-white text-sm w-full"
              >
                {working ? "Sending…" : "Continue with email"}
              </button>
            </form>
          ) : (
            <form className="space-y-2 w-full">
              <p className="text-center text-sm text-muted-foreground">
                Enter the verification code sent to {email}
              </p>
              {errorText && (
                <p className="text-red-600 text-center flex justify-center items-center w-full text-sm">{errorText}</p>
              )}
              <Input
                type="text"
                placeholder="Verification code"
                {...otpRegister('otpCode')}
                className="border-[color:var(--Greyscale-200,#D8DBE3)] shadow-[0px_1px_2px_0px_rgba(14,13,82,0.05)] px-4 py-3.5 border-solid text-foreground w-full rounded tracking-widest text-center"
              />
              <button
                onClick={otpSubmit(handleVerifyOtp)}
                disabled={working}
                className="flex justify-center items-center gap-2 self-stretch border border-[color:var(--Greyscale-800,#3F464B)] px-4 py-2.5 rounded border-solid bg-foreground text-white text-sm w-full"
              >
                {working ? "Verifying…" : "Verify"}
              </button>
              <button
                type="button"
                onClick={handleBack}
                disabled={working}
                className="flex justify-center items-center gap-2 self-stretch px-4 py-2.5 rounded text-sm w-full text-muted-foreground"
              >
                Back
              </button>
            </form>
          )}
          {!otpId && tgContext !== "" && tgContext !== "ios" && tgContext !== "android" && (
            <>
              <div className="flex items-center gap-2 py-4 w-full">
                <span className="flex-grow border-t h-px"></span>
                <div className="px-2 text-xs uppercase text-[color:var(--Greyscale-500,#868C95)] font-medium">Or</div>
                <span className="flex-grow border-t h-px"></span>
              </div>
              <div><GoogleAuth /></div>
            </>
          )}
        </CardContent>
      </div>
    </div>
  );
}

export default function Auth() {
  return (
    <Suspense>
      <AuthContent />
    </Suspense>
  );
}
