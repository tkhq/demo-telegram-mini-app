'use client'

import { getLocalStorageItemWithExipry, getPublicKeyFromPrivateKeyHex, GOOGLE_OAUTH_DECRYPT_KEY, GOOGLE_OAUTH_PUBLIC_KEY } from "@/util/util";
import { decryptCredentialBundle } from "@turnkey/crypto";
import { TelegramCloudStorageStamper } from "@turnkey/telegram-cloud-storage-stamper";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import RootLayout from "../layout";

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
		const oauthDecryptKey = getLocalStorageItemWithExipry(GOOGLE_OAUTH_DECRYPT_KEY);
		const oauthPublicKey = getLocalStorageItemWithExipry(GOOGLE_OAUTH_PUBLIC_KEY);

		//ensure we are in a telegram context by including the telegram web app script
		// const script = document.createElement('script');
		// script.src = "https://telegram.org/js/telegram-web-app.js";
		// document.head.appendChild(script);
		
		async function performGoogleAuth() {
			try {
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
						oauthDecryptKey
					);
			
					if (!decryptedData) {
						const queryParams = new URLSearchParams({
							error: "Failed google oauth",
						}).toString();
						router.push(`/auth?${queryParams}`);
					}
		
					// This stores the api credentials obtained from oauth into telegram cloud storage and those credentials can be used in other places in your application
					await TelegramCloudStorageStamper.create({
						cloudStorageAPIKey: {
							apiPublicKey: getPublicKeyFromPrivateKeyHex(decryptedData),
							apiPrivateKey: decryptedData,
						}
					});
		
					const queryParams = new URLSearchParams({
							organizationId: response.data.organizationId,
					}).toString();
					router.push(`/wallet?${queryParams}`);
				}
			} catch (e) {
				const queryParams = new URLSearchParams({
					error: "Failed google oauth",
				}).toString();
				router.push(`/auth?${queryParams}`);
			}
		}

		performGoogleAuth();
	})

	return (
		<div className="flex items-center justify-center min-h-screen">
			Logging in with Google...
		</div>
	)
}