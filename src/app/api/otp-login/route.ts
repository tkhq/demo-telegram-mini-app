'use server'

import { NextResponse } from 'next/server';
import { ApiKeyStamper, DEFAULT_SOLANA_ACCOUNTS, TurnkeyServerClient } from "@turnkey/sdk-server";
import type { v1ClientSignature } from "@turnkey/sdk-types";
import { Email } from "@/types/types";
import { DEMO_WALLET_NAME } from "@/util/util";

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
    const { email, verificationToken, publicKey, clientSignature } = await req.json() as {
      email: string;
      verificationToken: string;
      publicKey: string;
      clientSignature: v1ClientSignature;
    };

    if (!email || !verificationToken || !publicKey || !clientSignature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Look up or create sub-org — done after OTP is verified to prevent org spam
    let organizationId: string;

    const findRes = await client.getSubOrgIds({
      organizationId: PARENT_ORG_ID,
      filterType: "EMAIL",
      filterValue: email,
    });

    if (findRes.organizationIds.length === 1) {
      organizationId = findRes.organizationIds[0];
    } else if (findRes.organizationIds.length === 0) {
      const userName = (email as string).split("@")?.[0] ?? "Turnkey User";
      const subOrg = await client.createSubOrganization({
        organizationId: PARENT_ORG_ID,
        subOrganizationName: `Turnkey Demo Sub Org - ${email}`,
        rootQuorumThreshold: 1,
        rootUsers: [{
          userName,
          userEmail: email as Email,
          oauthProviders: [],
          authenticators: [],
          apiKeys: [],
        }],
        wallet: {
          walletName: DEMO_WALLET_NAME,
          accounts: DEFAULT_SOLANA_ACCOUNTS,
        },
      });
      organizationId = subOrg.subOrganizationId;
    } else {
      return NextResponse.json({ error: "Multiple sub-orgs found for this email" }, { status: 500 });
    }

    const loginRes = await client.otpLogin({
      organizationId,
      verificationToken,
      publicKey,
      clientSignature,
    });

    if (!loginRes.session) {
      return NextResponse.json({ error: "Login failed" }, { status: 500 });
    }

    return NextResponse.json({ organizationId }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
