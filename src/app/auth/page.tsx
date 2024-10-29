'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/card"
import  Input from "@/components/input"
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Email } from '@/types/types';
import axios from "axios";
import { generateP256KeyPair } from "@turnkey/crypto";

type EmailAuthData = {
  email: Email
}

type OAuthData = {
  oidcToken: string;
  provider: string;
}

export default function Auth() {
  const router = useRouter();
  const { register: emailFormRegister, handleSubmit: emailFormSubmit } =
    useForm<EmailAuthData>();
  const { register: oauthFormRegister, handleSubmit: oauthFormSubmit } =
    useForm<OAuthData>();

  async function handleEmailLogin (data: EmailAuthData) {
    const keyPair = generateP256KeyPair();

    try {
      const response = await axios.post("/api/auth", {
        type: "email",
        email: data.email,
        targetPublicKey: keyPair.publicKeyUncompressed,
      });

      // ToDo: store private key in localstorage
      // eventually can maybe store in tgram cloud storage :eyes:

      if (response.status == 200) {
        router.push("/email-auth")
      }
    } catch (e) {
      console.log(e)
    }
  }

  async function handleOAuthLogin (data: OAuthData) {
    const keyPair = generateP256KeyPair();

    try {
      const response = await axios.post("/api/auth", {
        type: "oauth",
        oidcToken: data.oidcToken,
        provider: data.provider,
        targetPublicKey: keyPair.publicKeyUncompressed,
      });
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <div className="min-h-screen bg-foreground flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-background">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">TurntCoin 🔑</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <form className="space-y-2">
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
          <div className="grid grid-cols-3 gap-2">
              <button onClick={() => oauthFormSubmit(handleOAuthLogin)} className="px-4 h-10 bg-foreground text-background border-solid border-input border rounded-md hover:bg-gray-800">
                Google
              </button>
              <button onClick={() => oauthFormSubmit(handleOAuthLogin)} className="px-4 h-10 bg-foreground text-background border-solid border-input border rounded-md hover:bg-gray-800">
                Apple
              </button>
              <button onClick={() => oauthFormSubmit(handleOAuthLogin)} className="px-4 h-10 bg-foreground text-background border-solid border-input border rounded-md hover:bg-gray-800">
                Facebook
              </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}