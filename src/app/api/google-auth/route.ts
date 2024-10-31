'use server'

import { NextResponse } from 'next/server';

const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);

    // To access parameters, use:
    const oidcToken = params.get('credential');

    if (!oidcToken) {
      // redirect to google oauth page
      const queryParams = new URLSearchParams({
        error: "Failed google oauth",
      }).toString();
      return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/auth?${queryParams}`, { status: 303 });
    }

    // redirect to google oauth page
    const queryParams = new URLSearchParams({
      oidcToken: oidcToken!,
    }).toString();
    return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/google-auth?${queryParams}`, { status: 303 })
  } catch (e) {
    // redirect to google oauth page
    const queryParams = new URLSearchParams({
      error: "Failed google oauth",
    }).toString();

    return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/auth?${queryParams}`, { status: 303 });
  }
}