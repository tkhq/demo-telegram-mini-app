'use server'

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);

    // To access parameters, use:
    const credential = params.get('credential');

    const oidcToken = credential?.split(".")[1]
    console.log(oidcToken)

  } catch (e) {
    return NextResponse.json({ error: e }, { status: 200})
  }
  

  return NextResponse.json({ status: 200})
}