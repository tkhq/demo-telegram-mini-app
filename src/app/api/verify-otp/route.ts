'use server'

import { NextResponse } from 'next/server';
import { ApiKeyStamper, TurnkeyServerClient } from "@turnkey/sdk-server";

const PARENT_ORG_ID = process.env.NEXT_PUBLIC_ORGANIZATION_ID!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

const client = new TurnkeyServerClient({
  apiBaseUrl: BASE_URL,
  organizationId: PARENT_ORG_ID,
  stamper: new ApiKeyStamper({
    apiPublicKey: process.env.API_PUBLIC_KEY!,
    apiPrivateKey: process.env.API_PRIVATE_KEY!,
  }),
});

export async function POST(req: Request) {
  try {
    const { otpId, encryptedOtpBundle } = await req.json();

    if (!otpId || !encryptedOtpBundle) {
      return NextResponse.json({ error: "otpId and encryptedOtpBundle are required" }, { status: 400 });
    }

    const res = await client.verifyOtp({ otpId, encryptedOtpBundle });

    if (!res.verificationToken) {
      return NextResponse.json({ error: "OTP verification failed" }, { status: 400 });
    }

    return NextResponse.json({ verificationToken: res.verificationToken }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "OTP verification failed" }, { status: 500 });
  }
}
