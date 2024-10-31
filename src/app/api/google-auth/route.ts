'use server'

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log(req)
  const { credential, clientId, client_id, select_by, g_csrf_token } = await req.json()

  console.log(credential);
  console.log(clientId);
  console.log(client_id);
  console.log(select_by);
  console.log(g_csrf_token);

  console.log(await req.json());

  return NextResponse.json({ status: 200})
}