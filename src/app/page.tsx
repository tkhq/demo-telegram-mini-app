'use client'

import Auth from "./auth/page";
import { NextResponse } from "next/server";

export default function Home() {
  return (
    <Auth/>
  );
}

export async function POST(request: Request) {
  console.log("Test")

  return new NextResponse()
}
