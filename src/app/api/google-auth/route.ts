'use server'

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.text();
  const params = new URLSearchParams(body);

  // To access parameters, use:
  const value = params.get('credential');

  console.log(value)

  // Or to get all parameters as an object:
  const paramsObject = Object.fromEntries(params);

  return NextResponse.json({ status: 200})
}