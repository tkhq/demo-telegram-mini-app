'use server'

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);

    // To access parameters, use:
    const credential = params.get('credential');

    const oidcToken = credential?.split(".")[1]

    if (!oidcToken) {
      // redirect to google oauth page
      const queryParams = new URLSearchParams({
        error: "Failed google oauth1",
      }).toString();
      NextResponse.redirect(`/auth?${queryParams}`);
    }

    // redirect to google oauth page
    const queryParams = new URLSearchParams({
      oidcToken: oidcToken!,
    }).toString();
    NextResponse.redirect(`/google-auth?${queryParams}`)
  } catch (e) {
    // redirect to google oauth page
    const queryParams = new URLSearchParams({
      error: "Failed google oauth2",
    }).toString();

    NextResponse.redirect(`/auth?${queryParams}`);
  }
}