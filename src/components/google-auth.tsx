'use client'

import { GOOGLE_OAUTH_DECRYPT_KEY, MILLIS_15_MINUTES, setLocalStorageItemWithExipry } from "@/util/util";
import { CredentialResponse, GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google"
import { generateP256KeyPair } from "@turnkey/crypto";
import { sha256 } from "viem";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID!
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!

export default function GoogleAuth() {
  const keyPair = generateP256KeyPair();
  const nonce = sha256(
    keyPair.publicKey as `0x${string}`
  ).replace(/^0x/, "")

  setLocalStorageItemWithExipry(GOOGLE_OAUTH_DECRYPT_KEY, keyPair.privateKey, MILLIS_15_MINUTES);

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