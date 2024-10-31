'use server'

import { NextResponse } from 'next/server';

const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);

    // To access parameters, use:
    const credential = params.get('credential');
    console.log(credential)

    const oidcToken = credential?.split(".")[1]
    console.log(oidcToken)

    if (!oidcToken) {
      // redirect to google oauth page
      const queryParams = new URLSearchParams({
        error: "Failed google oauth1",
      }).toString();
      return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/auth?${queryParams}`);
    }

    // redirect to google oauth page
    const queryParams = new URLSearchParams({
      oidcToken: oidcToken!,
    }).toString();
    return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/google-auth?${queryParams}`)
  } catch (e) {
    // redirect to google oauth page
    const queryParams = new URLSearchParams({
      error: "Failed google oauth2",
    }).toString();

    return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/auth?${queryParams}`);
  }
}