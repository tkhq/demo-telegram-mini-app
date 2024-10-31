'use server'

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log(req)

  console.log(req.body)

  const reader = req.body?.getReader()
  let result = '';
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  console.log(result)
  console.log("result")

  // Decode any remaining bytes
  result += decoder.decode();

  console.log(result)

  return NextResponse.json({ status: 200})
}