'use server'

import { NextResponse } from 'next/server';
import { ApiKeyStamper, DEFAULT_SOLANA_ACCOUNTS, TurnkeyServerClient } from "@turnkey/sdk-server";
import { decode, JwtPayload } from "jsonwebtoken";
import { Email, OauthProviderParams } from "@/types/types";

const PARENT_ORG_ID = process.env.NEXT_PUBLIC_ORGANIZATION_ID
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL
const API_PUBLIC_KEY = process.env.API_PUBLIC_KEY
const API_PRIVATE_KEY = process.env.API_PRIVATE_KEY

const stamper = new ApiKeyStamper({
  apiPublicKey: API_PUBLIC_KEY!,
  apiPrivateKey: API_PRIVATE_KEY!
});
  
const client = new TurnkeyServerClient({
  apiBaseUrl: BASE_URL!,
  organizationId: PARENT_ORG_ID!,
  stamper
});

export async function POST(req: Request) {
  try {
    const { type, email, oidcToken, provider, targetPublicKey } = await req.json();

    // check for valid type parameter
    if (!type) {
      return NextResponse.json({ error: "Didnt receive type parameter"}, { status: 400});
    }

    // check for valid targetPublicKey parameter
    if (!targetPublicKey) {
      return NextResponse.json({ error: "Didnt receive valid target public key parameter"}, { status: 400});
    }

    if (type === 'email') {
      // check for valid email parameter
      if (!email || !isEmail(email)) {
        return NextResponse.json({ error: "Didnt receive valid email parameter"}, { status: 400});
      }

      // check if email exists already
      const findUserResponse = await client.getSubOrgIds({
        organizationId: PARENT_ORG_ID,
        filterType: "EMAIL",
        filterValue: email
      })

      // if email doesnt exist create new sub org and perform email auth
      if (findUserResponse.organizationIds.length == 0) {
        // create new sub org
        const { subOrg, user } = await createSubOrg(email)
        // if sub org creation was successful perform email auth
        if (subOrg && user) {
          // perform email auth
          const emailAuthResponse = await client.emailAuth({
            organizationId: subOrg.subOrganizationId,
            email: email,
            targetPublicKey
          });
        
          // validate response from email auth
          const {userId, apiKeyId } = emailAuthResponse;
          if (!userId || !apiKeyId) {
            return NextResponse.json({ error: "Failed initiating email authentication"}, { status: 500});
          }
        }
      } else if (findUserResponse.organizationIds.length == 1) {
        // user already exists perform email auth
        const emailAuthResponse = await client.emailAuth({
          organizationId: findUserResponse.organizationIds[0],
          email: email,
          targetPublicKey
        });

        // validate response from email auth
        const {userId, apiKeyId } = emailAuthResponse;
        if (!userId || !apiKeyId) {
          return NextResponse.json({ error: "Failed initiating email authentication"}, { status: 500});
        }
      } else {
        // found multiple users? can't determine to know who to sign in - shouldnt get here
        return NextResponse.json({ error: "Error logging user in"}, { status: 500});
      } 
    } else if (type === 'oauth') {
      return NextResponse.json({ error: "Oauth not implemented"}, { status: 501});

    } else {
      return NextResponse.json({ error: "Didnt receive valid type parameter"}, { status: 400});
    }
  } catch (e) {
    return NextResponse.json({ error: "Failed performing user authentication"}, { status: 500});
  }

  return NextResponse.json({ status: 200 })
}

function isEmail(email: string): email is Email {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function createSubOrg(email?: Email, oauth?: OauthProviderParams) {
  let oauthProviders: OauthProviderParams[] = [];

  let userEmail = email;

  if (oauth) {
    // populate oauth providers
  }

  if(!userEmail) {
    // return failure?
  }

  const subOrganizationName = `TurntCoin Sub Org - ${userEmail}`
  const userName = userEmail ? userEmail.split("@")?.[0] || userEmail : "TurntCoin User"

  const subOrg = await client.createSubOrganization({
    organizationId: PARENT_ORG_ID,
    subOrganizationName,
    rootUsers: [
      {
        userName,
        userEmail,
        oauthProviders,
        authenticators: [],
        apiKeys: [],
      },
    ],
    rootQuorumThreshold: 1,
    wallet: {
      walletName: "TurntCoin Wallet",
      accounts: DEFAULT_SOLANA_ACCOUNTS,
    }
  });

  const userId = subOrg.rootUserIds?.[0]
  if (!userId) {
    throw new Error("No root user ID found")
  }
  const { user } = await client.getUser({
    organizationId: subOrg.subOrganizationId,
    userId,
  })

  return { subOrg, user }
}
