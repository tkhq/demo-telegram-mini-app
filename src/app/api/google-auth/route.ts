'use server'

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log(req)
  const { credential } = await req.json()

  console.log(credential);

  console.log(await req.json());

  return NextResponse.json({ status: 200})
}