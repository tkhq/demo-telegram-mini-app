'use client'

import { useState } from 'react'
import { CardContent, CardHeader, CardTitle } from "@/components/card"
import  Input from "@/components/input"
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Email } from '@/types/types';

type EmailAuthData = {
  email: Email
}

export default function Auth() {
  const router = useRouter();
  const { register: emailFormRegister, handleSubmit: emailFormSubmit } =
    useForm<EmailAuthData>();

  async function handleEmailLogin (data: EmailAuthData) {
    router.push("/play")
  }

  const handleOAuthLogin = (provider: string) => {
    // Handle OAuth login logic here
    console.log('Logging in with', provider)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">TurntCoin 🔑</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <form>
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
              <button onClick={() => handleOAuthLogin('Google')} className="px-4 h-10 bg-foreground text-background border-solid border-input border rounded-md hover:bg-gray-800">
                Google
              </button>
              <button onClick={() => handleOAuthLogin('Apple')} className="px-4 h-10 bg-foreground text-background border-solid border-input border rounded-md hover:bg-gray-800">
                Apple
              </button>
              <button onClick={() => handleOAuthLogin('Facebook')} className="px-4 h-10 bg-foreground text-background border-solid border-input border rounded-md hover:bg-gray-800">
                Facebook
              </button>
          </div>
        </CardContent>
      </div>
    </div>
  )
}