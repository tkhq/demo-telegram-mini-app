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

  const onSuccess = async (credentialResponse: CredentialResponse) => {
    // if oauth with google was successful start the auth process
    if (credentialResponse.credential) {
      try {
        const response = await axios.post("/api/auth", {
          type: "oauth",
          oidcToken: credentialResponse.credential,
          provider: "Google Auth - Embedded Wallet",
          targetPublicKey: keyPair.publicKeyUncompressed,
        });
  
        if (response.status == 200) {
          // decrypt respone bundle and create a telegram stamper to put creds in cloud storage
          const decryptedData = decryptCredentialBundle(
            response.data.credentialBundle,
            keyPair.privateKey
          );

          if (!decryptedData) {
            // some failure
          }

          // This stores the api credentials obtained from oauth into telegram cloud storage and those credentials can be used in other places in your application
          await TelegramCloudStorageStamper.create({
            apiPublicKey: getPublicKeyFromPrivateKeyHex(decryptedData!),
            apiPrivateKey: decryptedData!,
          });

          const queryParams = new URLSearchParams({
            organizationId: response.data.organizationId,
          }).toString();
          router.push(`/play${queryParams}`);
        }
      } catch (e) {
        console.log(e)
      }
      
    }
  }

  // const googleLogin = useGoogleLogin({
  //   onSuccess,
  //   flow: 'implicit',
  // })

  return (
    <GoogleOAuthProvider clientId={clientId}>
      
      {/* <button onClick={() => googleLogin() }className="w-full px-4 h-10 bg-foreground text-background border-solid border-input border rounded-md hover:bg-gray-800">
        Google
      </button>  */}
      <GoogleLogin
        nonce={nonce}
        width={235}
        containerProps={{ className: "w-full bg-white flex justify-center rounded-md" }}
        onSuccess={onSuccess}
        useOneTap={false}
        auto_select={false}
        ux_mode="redirect"
        login_uri={`${SITE_URL}`}
      />
    </GoogleOAuthProvider>
  )

}