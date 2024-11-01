import { Card, CardContent, CardHeader, CardTitle } from "@/components/card"
import Link from "next/link"

export default function DisplayTelegramMessage() {
  return (
    <div className="min-h-screen bg-foreground flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-background">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            This app is meant for telegram
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            This example telegram mini app powered by Turnkey can be found at this bot link <Link href="https://t.me/TurnkeyDemoAppBot" className="font-semibold underliner">@TurnkeyDemoAppBot</Link>, try messaging it!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}