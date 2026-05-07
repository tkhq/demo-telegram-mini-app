'use server'

import { NextResponse } from 'next/server';
import { ApiKeyStamper, DEFAULT_SOLANA_ACCOUNTS, TurnkeyServerClient } from "@turnkey/sdk-server";
import { DEMO_WALLET_NAME, decodeJwt } from "@/util/util";

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
    const { oidcToken, publicKey } = await req.json();

    if (!oidcToken || !publicKey) {
      return NextResponse.json({ error: "oidcToken and publicKey are required" }, { status: 400 });
    }

    // Look up sub-org by OIDC token — done after Google has already verified the identity
    let organizationId: string;

    const findRes = await client.getSubOrgIds({
      organizationId: PARENT_ORG_ID,
      filterType: "OIDC_TOKEN",
      filterValue: oidcToken,
    });

    if (findRes.organizationIds.length === 1) {
      organizationId = findRes.organizationIds[0];
    } else if (findRes.organizationIds.length === 0) {
      const decoded = decodeJwt(oidcToken);
      const email = decoded?.email as string | undefined;
      const userName = email?.split("@")?.[0] ?? "Google User";

      const subOrg = await client.createSubOrganization({
        organizationId: PARENT_ORG_ID,
        subOrganizationName: `Turnkey Demo Sub Org - ${email ?? Date.now()}`,
        rootQuorumThreshold: 1,
        rootUsers: [{
          userName,
          userEmail: email,
          oauthProviders: [{ providerName: "Google", oidcToken }],
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
      return NextResponse.json({ error: "Multiple sub-orgs found for this Google account" }, { status: 500 });
    }

    const loginRes = await client.oauthLogin({
      organizationId,
      oidcToken,
      publicKey,
    });

    if (!loginRes.session) {
      return NextResponse.json({ error: "OAuth login failed" }, { status: 500 });
    }

    return NextResponse.json({ organizationId }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "OAuth login failed" }, { status: 500 });
  }
}
