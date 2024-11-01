'use server'

import { broadcast, connect, transfer } from "@/web3/web3";
import { ApiKeyStamper,TurnkeyServerClient } from "@turnkey/sdk-server";
import { NextResponse } from "next/server";
import axios from "axios";
import { TurnkeySigner } from "@turnkey/solana";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const PARENT_ORG_ID = process.env.NEXT_PUBLIC_ORGANIZATION_ID
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL
const API_PUBLIC_KEY = process.env.API_PUBLIC_KEY
const API_PRIVATE_KEY = process.env.API_PRIVATE_KEY
const PARENT_SOLANA_ADDRESS = process.env.PARENT_SOLANA_ADDRESS
const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL

const stamper = new ApiKeyStamper({
    apiPublicKey: API_PUBLIC_KEY!,
    apiPrivateKey: API_PRIVATE_KEY!
});

const client = new TurnkeyServerClient({
    apiBaseUrl: BASE_URL!,
    organizationId: PARENT_ORG_ID!,
    stamper
});

const signer = new TurnkeySigner({
  organizationId: PARENT_ORG_ID!,
  client
});

export async function POST(req: Request) {
  try {
    const connection = connect();

    // get user sub organization id
    const url = new URL(req.url);
    const organizationId = url.searchParams.get('organizationId');
    const queryParams = new URLSearchParams({
      organizationId: organizationId!,
    }).toString();

    // get user demo wallet address
    const getAddressResponse = await axios.get(`${PUBLIC_SITE_URL}/api/getAddress?${queryParams}`, { 
      params: {
        organizationId: organizationId
      }
    });

    if(!getAddressResponse.data.address) {
      return NextResponse.json({ error: "Failed to get demo address"}, { status: 400});
    }

    // ToDo: check demo balance
    // ToDo: reduce demo balance

    // construct transaction
    const amount = 0.01 * LAMPORTS_PER_SOL;
    const transaction = await transfer(connection, amount, PARENT_SOLANA_ADDRESS!, getAddressResponse.data.address);
    await signer.addSignature(transaction, PARENT_SOLANA_ADDRESS!);

    // broadcast transaction
    const transactionHash = await broadcast(connection, transaction);

    return NextResponse.json({ transaction: transactionHash }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Failed redeeming denet sol"}, { status: 500});
  }
}
