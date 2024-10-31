'use server'

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log(req)

  const url = new URL(req.url)
  const params = url.searchParams;
  console.log(url)

  console.log("Entries: ")
  params.forEach((entry) => {
    console.log(entry)
  })

  return NextResponse.json({ status: 200})
}