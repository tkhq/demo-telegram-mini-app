'use server'

import { NextResponse } from 'next/server';
import { ApiKeyStamper, TurnkeyServerClient } from "@turnkey/sdk-server";
import { Email } from "@/types/types";

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
    const { type, email, targetPublicKey } = await req.json();

    if (!type) {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }

    if (type === 'email') {
      if (!email || !isEmail(email)) {
        return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
      }

      const otpRes = await client.initOtp({
        otpType: "OTP_TYPE_EMAIL",
        contact: email,
        appName: "Turnkey Demo Wallet",
        // targetPublicKey is optional; used as userIdentifier for rate-limiting
        ...(targetPublicKey ? { userIdentifier: targetPublicKey } : {}),
      });

      if (!otpRes.otpId || !otpRes.otpEncryptionTargetBundle) {
        return NextResponse.json({ error: "Failed to initiate OTP" }, { status: 500 });
      }

      return NextResponse.json({ otpId: otpRes.otpId, otpEncryptionTargetBundle: otpRes.otpEncryptionTargetBundle }, { status: 200 });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

function isEmail(email: string): email is Email {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
