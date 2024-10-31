'use client'

import { getLocalStorageItemWithExipry, getPublicKeyFromPrivateKeyHex, GOOGLE_OAUTH_DECRYPT_KEY, GOOGLE_OAUTH_PUBLIC_KEY } from "@/util/util";
import { decryptCredentialBundle } from "@turnkey/crypto";
import TelegramCloudStorageStamper from "@turnkey/telegram-cloud-storage-stamper";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function GoogleAuth() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const oidcToken = searchParams.get('oidcToken');

	if (!oidcToken) {
		const queryParams = new URLSearchParams({
			error: "Failed google oauth",
		}).toString();
		router.push(`/auth?${queryParams}`);
	}

	useEffect(() => {
		const oauthDecryptyKey = getLocalStorageItemWithExipry(GOOGLE_OAUTH_DECRYPT_KEY);
		const oauthPublicKey = getLocalStorageItemWithExipry(GOOGLE_OAUTH_PUBLIC_KEY);
		async function performGoogleAuth() {
			const response = await axios.post("/api/auth", {
				type: "oauth",
				oidcToken: oidcToken,
				provider: "Google Auth - Embedded Wallet",
				targetPublicKey: oauthPublicKey,
			});
		
			if (response.status == 200) {
				// decrypt respone bundle and create a telegram stamper to put creds in cloud storage
				const decryptedData = decryptCredentialBundle(
					response.data.credentialBundle,
					oauthDecryptyKey
				);
		
				if (!decryptedData) {
					const queryParams = new URLSearchParams({
						error: "Failed google oauth",
					}).toString();
					router.push(`/auth?${queryParams}`);
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
		}

		try {
			performGoogleAuth();
		} catch (e) {
			const queryParams = new URLSearchParams({
				error: "Failed google oauth",
			}).toString();
			router.push(`/auth?${queryParams}`);
		}
	})

	return (
			<>Loading...</>
	)
}