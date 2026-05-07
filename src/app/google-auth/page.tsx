'use client'

import { TelegramCloudStorageStamper, DEFAULT_TURNKEY_CLOUD_STORAGE_KEY } from "@turnkey/telegram-cloud-storage-stamper";
import { TURNKEY_OAUTH_TEMP_KEY } from "@/components/google-auth";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function GoogleAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oidcToken = searchParams.get('oidcToken');

  useEffect(() => {
    if (!oidcToken) {
      router.push('/auth?error=Failed+google+oauth');
      return;
    }

    async function performGoogleAuth() {
      try {
        // Read the key pair written to Cloud Storage before the OAuth redirect
        const stamper = new TelegramCloudStorageStamper();
        const tempKey = await stamper.getAPIKey(TURNKEY_OAUTH_TEMP_KEY);

        if (!tempKey) {
          router.push('/auth?error=Failed+google+oauth');
          return;
        }

        const { apiPublicKey: publicKey, apiPrivateKey: privateKey } = tempKey;

        // Sub-org lookup/create + oauthLogin
        const loginRes = await axios.post("/api/oauth-login", {
          oidcToken,
          publicKey,
        });

        if (loginRes.status !== 200) {
          router.push('/auth?error=Failed+google+oauth');
          return;
        }

        const { organizationId } = loginRes.data;

        // Promote temp key to the default Cloud Storage slot used by the rest of the app
        await TelegramCloudStorageStamper.create({
          cloudStorageAPIKey: { apiPublicKey: publicKey, apiPrivateKey: privateKey },
        });

        // Clean up the temp key
        await stamper.clearItem(TURNKEY_OAUTH_TEMP_KEY);

        router.push(`/wallet?organizationId=${organizationId}`);
      } catch {
        router.push('/auth?error=Failed+google+oauth');
      }
    }

    performGoogleAuth();
  }, [oidcToken, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      Logging in with Google…
    </div>
  );
}

export default function GoogleAuth() {
  return (
    <Suspense>
      <GoogleAuthContent />
    </Suspense>
  );
}
