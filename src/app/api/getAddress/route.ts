'use server'

import { TURNTCOIN_WALLET_NAME } from '@/util/util';
import { ApiKeyStamper, TurnkeyServerClient } from '@turnkey/sdk-server';
import { NextResponse } from 'next/server';

const PARENT_ORG_ID = process.env.NEXT_PUBLIC_ORGANIZATION_ID
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL
const API_PUBLIC_KEY = process.env.API_PUBLIC_KEY
const API_PRIVATE_KEY = process.env.API_PRIVATE_KEY

const stamper = new ApiKeyStamper({
    apiPublicKey: API_PUBLIC_KEY!,
    apiPrivateKey: API_PRIVATE_KEY!,
});

const client = new TurnkeyServerClient({
    apiBaseUrl: BASE_URL!,
    organizationId: PARENT_ORG_ID!,
    stamper
});

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const organizationId = url.searchParams.get('organizationId');

        // confirm we received the organization ID parameter
        if(!organizationId) {
            return NextResponse.json({ error: "Didnt receive organizationID parameter"}, { status: 400});
        }

        // get users wallets
        const getWalletResponse = await client.getWallets({
            organizationId: organizationId,
        });

        // find the wallet id of the TurntCoin wallet
        let turntCoinWalletId;
        getWalletResponse.wallets.forEach((wallet) => {
            if (wallet.walletName === TURNTCOIN_WALLET_NAME) {
                turntCoinWalletId = wallet.walletId;
            }
        })

        if (!turntCoinWalletId) {
            return NextResponse.json({ error: "User does not have a TurntCoin wallet"}, { status: 400});
        }

        // get the accounts in the wallet
        const getAccountsResponse = await client.getWalletAccounts({
            organizationId: organizationId,
            walletId: turntCoinWalletId
        });

        let turntCoinWalletAddress;
        getAccountsResponse.accounts.forEach((account) => {
            if (account.addressFormat  === 'ADDRESS_FORMAT_SOLANA') {
                turntCoinWalletAddress = account.address;
            }
        })

        if(!turntCoinWalletAddress) {
            return NextResponse.json({ error: "Users TurntCoin wallet does not have a valid account"}, { status: 400});
        }

        return NextResponse.json({ address: turntCoinWalletAddress }, { status: 200 })
    } catch (e) {
        return NextResponse.json({ error: "Failed retrieving TurntCoin wallet"}, { status: 500});
    }
}