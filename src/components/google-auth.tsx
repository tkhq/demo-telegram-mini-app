'use client'

import { getPublicKeyFromPrivateKeyHex } from "@/util/util";
import { CredentialResponse, useGoogleLogin, GoogleOAuthProvider, TokenResponse, GoogleLogin } from "@react-oauth/google"
import { decryptCredentialBundle, generateP256KeyPair } from "@turnkey/crypto";
import TelegramCloudStorageStamper from "@turnkey/telegram-cloud-storage-stamper";
import axios from "axios";
import { useRouter } from "next/navigation";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID!
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!

export default function GoogleAuth() {
  const router = useRouter()
  const keyPair = generateP256KeyPair();
  const nonce = keyPair.publicKey;

  const onSuccess = async (credentialResponse: CredentialResponse) => {}

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleLogin
        nonce={nonce}
        width={235}
        containerProps={{ className: "w-full bg-white flex justify-center rounded-md" }}
        onSuccess={onSuccess}
        useOneTap={false}
        auto_select={false}
        ux_mode="redirect"
        login_uri={`${SITE_URL}/api/google-auth`}
      />
    </GoogleOAuthProvider>
  )

}