'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/card"
import Input from "@/components/input"
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation"

type EmailAuthCodeData = {
  authCode: string;
}

export default function EmailAuth() {
  const router = useRouter()
  const { register: emailAuthCodeFormRegister, handleSubmit: emailAuthCodeFormSubmit } =
    useForm<EmailAuthCodeData>();

  const handleEmailAuth = (data: EmailAuthCodeData) => {
    // Handle authentication code verification logic here
    console.log('Verifying auth code:', data.authCode)
  }

  const handleReturnToLogin = () => {
    router.push("/auth")
  }

  return (
    <div className="min-h-screen bg-foreground flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-background">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">TurntCoin 🔑</CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Paste your email authentication code below
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <form className="space-y-2">
              <Input
                type="text"
                placeholder="Paste here"
                {...emailAuthCodeFormRegister('authCode')}
              />
              <button onClick={emailAuthCodeFormSubmit(handleEmailAuth)} className="w-full px-4 h-10 bg-foreground text-background border-solid border-input border rounded-md hover:bg-gray-800">
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
          <button  onClick={handleReturnToLogin} className="w-full px-4 h-10 bg-background text-foreground border-solid border-input border rounded-md hover:bg-gray-100">
            Return to Login
          </button>
        </CardContent>
      </Card>
    </div>
  )
}