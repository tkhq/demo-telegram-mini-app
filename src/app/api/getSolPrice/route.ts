'use server'

import axios from "axios";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'solana',
        vs_currencies: 'usd',
      },
    });
    const solPrice = response.data.solana.usd;
    return NextResponse.json({ solPrice: solPrice }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ status: 404 });
  }
}