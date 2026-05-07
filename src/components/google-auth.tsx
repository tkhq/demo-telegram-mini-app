'use client'

import { getPublicKeyFromPrivateKeyHex } from "@/util/util";
import { TelegramCloudStorageStamper } from "@turnkey/telegram-cloud-storage-stamper";
import { generateP256KeyPair } from "@turnkey/crypto";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useEffect, useState } from "react";
import { sha256 } from "viem";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

// Temp key used to persist the P256 key pair across the OAuth redirect
export const TURNKEY_OAUTH_TEMP_KEY = "TURNKEY_OAUTH_TEMP_KEY";

export default function GoogleAuth() {
  // nonce is null until the key is safely in Cloud Storage — button is hidden until then
  const [nonce, setNonce] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const kp = generateP256KeyPair();
        const publicKey = getPublicKeyFromPrivateKeyHex(kp.privateKey);

        // Write to Cloud Storage BEFORE the redirect so it survives navigation
        const stamper = new TelegramCloudStorageStamper();
        await stamper.insertAPIKey(publicKey, kp.privateKey, TURNKEY_OAUTH_TEMP_KEY);

        // Nonce binds the OIDC token to this key pair: Google embeds sha256(publicKey) in the token
        setNonce(sha256(`0x${publicKey}` as `0x${string}`).slice(2));
      } catch {
        // Not in a Telegram WebApp context — button stays hidden
      }
    }
    init();
  }, []);

  if (!nonce) return null;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleLogin
        nonce={nonce}
        width={342}
        containerProps={{ className: "w-full bg-white flex justify-center rounded-md" }}
        onSuccess={() => {}}
        useOneTap={false}
        auto_select={false}
        ux_mode="redirect"
        login_uri={`${SITE_URL}/api/google-auth`}
      />
    </GoogleOAuthProvider>
  );
}
