# Turnkey Demo Telegram Mini App

A non-custodial Solana wallet embedded in a Telegram mini-app, built on [Turnkey](https://turnkey.com).

## What this demo does

Users open the mini-app inside Telegram, authenticate, and get a Solana wallet they fully control. Their signing key is stored in [Telegram Cloud Storage](https://core.telegram.org/bots/webapps#cloudstorage) — accessible only from this mini-app's JavaScript context, never exposed to the server.

**Supported auth methods:**
- **Email OTP** — a verification code is sent to the user's email; the session key is generated client-side and stored only in Telegram Cloud Storage
- **Google OAuth** — available on Telegram Desktop only in this demo. On mobile, `window.open()` popups are blocked and external redirects lose the WebApp JavaScript context. A mobile-compatible approach is possible — use `openLink()` to launch OAuth in the external browser, then redirect back via a Telegram deep link (`t.me/yourbot/app?startapp=...`) to reopen the mini-app with the token — but it requires an intermediate callback server to bridge Google's redirect to the deep link, and is out of scope for this demo.

**After authentication**, users can:
- View their Solana (devnet) balance
- Request devnet SOL airdrops (up to 5, each 0.01 SOL)
- Send SOL to any Solana address
- Receive SOL (display address + copy to clipboard)

## Transaction flow

Each user gets a dedicated Turnkey sub-organization with a Solana wallet. There are two types of transactions in this demo: user-initiated sends, signed by the user's session key inside the mini-app; and "Add Funds" transfers, sent by the backend and signed with the parent org's API key.

**Add Funds**

Tapping "Add Funds" drips 0.01 devnet SOL into the user's wallet from a pre-funded parent org wallet. The parent org wallet (`PARENT_SOLANA_ADDRESS`) needs to be funded with devnet SOL once at setup time (see step 2 in Running locally); the server then signs each user transfer from it using the parent org's Turnkey API key.

1. Client checks a counter in Telegram Cloud Storage and blocks the call if it has already requested funds 5 times (client-side only — not enforced server-side), then calls `/api/redeem`
2. Server looks up the user's sub-org Solana address
3. Server builds a transfer of 0.01 SOL from `PARENT_SOLANA_ADDRESS` to the user's address
4. Server signs with the parent org's Turnkey API key and broadcasts on devnet
5. User's balance increases by 0.01 SOL

**Send SOL**
1. Client builds an unsigned Solana transfer transaction (recipient + amount)
2. Client calls `TurnkeySigner.addSignature` — this stamps the request with the session key stored in Telegram Cloud Storage and sends it to Turnkey's API, which signs inside the secure enclave
3. Signed transaction is broadcast directly from the client to devnet

## Architecture

```
bot/
  └── api/webhook.js    — launcher only: responds to any message with a "Launch app" button

src/                    — Next.js mini-app
  ├── app/auth          — auth landing (email OTP + Google OAuth)
  ├── app/wallet        — wallet dashboard
  ├── app/send          — send SOL
  ├── app/receive       — receive (display address)
  └── app/api/          — server-side routes
```

> **Note:** Telegram Cloud Storage (`window.Telegram.WebApp.CloudStorage`) is only accessible inside the WebApp JavaScript context — the bot running server-side has no access to it. All key storage and signing logic live in the mini-app. If you want a server-side bot or agent to sign on behalf of users, set up a [delegated access user](https://docs.turnkey.com/concepts/policies/delegated-access-frontend) in each user's sub-org instead. See [Agentic Wallets](https://docs.turnkey.com/products/embedded-wallets/features/agentic-wallets) for the full pattern.

## Session key storage

After authentication, Turnkey issues the user a P256 API key pair that acts as their session credential. This demo stores that key pair in **Telegram Cloud Storage** via [`TelegramCloudStorageStamper`](https://github.com/tkhq/sdk/tree/main/packages/telegram-cloud-storage-stamper).

## Auth flows

### Email OTP

1. Client generates a P256 key pair in the browser
2. Client calls `/api/auth` → server calls `initOtp` → verification code sent to inbox; server returns `otpId` + `otpEncryptionTargetBundle`
3. Client encrypts the OTP code using `encryptOtpCodeToBundle(code, bundle, publicKey)` — the plaintext code never leaves the browser
4. Client sends the encrypted bundle to `/api/verify-otp` → server calls `verifyOtp` → returns a `verificationToken`
5. Client signs the `verificationToken` with the P256 private key to produce a `clientSignature` — proving ownership of the key
6. Client calls `/api/otp-login` with `verificationToken`, `publicKey`, and `clientSignature` → server looks up or creates the sub-org, then calls `otpLogin` which registers the public key as a session API key
7. Client stores the P256 private key in Telegram Cloud Storage via `TelegramCloudStorageStamper`

### Google OAuth

1. Client generates a P256 key pair. The public key is hashed (`sha256(publicKey)`) and passed as the OAuth nonce — Google embeds it in the OIDC token, binding the token to this key pair. The full key pair is written to Telegram Cloud Storage under a temp slot before the redirect, because all JS memory is lost during navigation and the private key can't be recovered from the nonce alone
2. Google Login button redirects to Google, which POSTs the OIDC token back to `/api/google-auth`
3. `/api/google-auth` immediately redirects the browser to the `/google-auth` client page with the OIDC token as a query param
4. `/google-auth` page reads the temp key pair from Cloud Storage → calls `/api/oauth-login` with the OIDC token and public key
5. Server looks up or creates the sub-org, calls `oauthLogin` to register the public key as a session API key
6. Client promotes the temp key to the default Cloud Storage slot and clears the temp entry

### Session check

On every load, `page.tsx` tries to instantiate a `TelegramCloudStorageStamper` and calls `getWhoami` against the parent org. If a valid session key is found, the user is redirected to the wallet. If not (no key stored, or key expired), the auth form is rendered in-place.

## Code map

| Path | Description |
|---|---|
| `src/app/page.tsx` | Entry point — checks for existing session key, redirects to wallet or renders auth in-place |
| `src/app/auth/` | Auth page: email input → OTP input (no page navigation) |
| `src/app/google-auth/` | OAuth callback page — reads temp key, calls oauth-login, cleans up |
| `src/app/wallet/` | Wallet dashboard |
| `src/app/send/` | Send SOL flow |
| `src/app/receive/` | Receive — display address |
| `src/app/api/auth/` | Initiates email OTP (`initOtp`) |
| `src/app/api/verify-otp/` | Verifies the OTP code, returns a `verificationToken` |
| `src/app/api/otp-login/` | Sub-org lookup/create + `otpLogin` |
| `src/app/api/google-auth/` | Receives Google OAuth POST redirect, extracts OIDC token and redirects browser to `/google-auth` client page |
| `src/app/api/oauth-login/` | Sub-org lookup/create + `oauthLogin` |
| `src/app/api/redeem/` | Airdrops 0.01 devnet SOL from the parent wallet |
| `bot/api/webhook.js` | Telegram bot webhook — sends "Launch app" button only |

## Environment variables

### Mini-app (`src/`)

```
NEXT_PUBLIC_ORGANIZATION_ID=        # Turnkey parent org ID
NEXT_PUBLIC_BASE_URL=               # Turnkey API base URL (https://api.turnkey.com)
API_PUBLIC_KEY=                     # Server-side Turnkey API key (public)
API_PRIVATE_KEY=                    # Server-side Turnkey API key (private)
NEXT_PUBLIC_SITE_URL=               # Deployed URL of this Next.js app
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID= # Google OAuth client ID (desktop login only)
PARENT_SOLANA_ADDRESS=              # Solana address of the parent org wallet that funds users via "Add Funds"
```

### Bot (`bot/`)

```
TELEGRAM_BOT_TOKEN_AUTH=            # Bot token from @BotFather
PUBLIC_SITE_URL_AUTH=               # Mini-app URL opened by the "Launch app" button
```

## Running locally

### 1. Create a Telegram bot (one-time)

Message [@BotFather](https://t.me/botfather) and run `/newbot`. Copy the bot token — you'll need it for `TELEGRAM_BOT_TOKEN_AUTH`.

### 2. Set up Turnkey (one-time)

Follow the [Quickstart](https://docs.turnkey.com/getting-started/quickstart) to get a parent org and a root user API key pair.

Create a Solana wallet inside that parent org and fund it with devnet SOL — this is the wallet that airdrops SOL to users. You can use the [Solana devnet faucet](https://faucet.solana.com) to airdrop SOL to `PARENT_SOLANA_ADDRESS`.

### 3. Set up Google OAuth

If you want Google login, create an OAuth 2.0 client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

- **Authorized redirect URIs** — add the full path (not just the domain):
  ```
  https://xxxx.ngrok-free.app/api/google-auth
  ```
  Update this every time your ngrok URL changes. A `redirect_uri_mismatch` error means this URI doesn't match what's registered.

Copy the **Client ID** into `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID`.

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

### 5. Start the mini-app and expose it

Telegram requires a public HTTPS URL to open a WebApp. Start the tunnel first so you have the URL before the dev server starts:

```bash
ngrok http 3000
```

Copy the ngrok HTTPS URL (e.g. `https://xxxx.ngrok-free.app`) and set it as `NEXT_PUBLIC_SITE_URL` in `.env.local`, then fill in the remaining values.

Now start the dev server:

```bash
npm install
npm run dev          # mini-app on http://localhost:3000
```

### 6. Point BotFather at your local URL

The bot webhook is only needed if you want the bot to reply to messages with a "Launch app" button. For local development, skip it — configure a **Menu Button** in BotFather instead:

- Open **@BotFather** in Telegram and send `/setmenubutton`
- Select your bot from the list
- Choose **"Set menu button URL"** when prompted for the button type
- Enter a button title (e.g. `Open App`)
- Enter your ngrok URL (e.g. `https://xxxx.ngrok-free.app`)

This lets you open the mini-app directly from the bot's profile in Telegram Desktop without running any bot server.

### 7. Open the app

Open your bot in **Telegram Desktop**, click the menu button, and the mini-app loads from your local dev server.

> **Note:** ngrok gives a new URL on each run (free plan). When it changes, update `NEXT_PUBLIC_SITE_URL`, repeat step 6, and update the Google Console redirect URI if you're using Google OAuth.

---

### Optional: run the bot webhook locally

If you want the bot to reply to `/start` with the button (rather than using the menu button), the bot is a Vercel serverless function. Run it locally with:

```bash
cd bot && npm install
vercel dev   # requires the Vercel CLI
```

Then register the webhook:

```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<your-ngrok-url>/api/webhook
```

See the [Vercel serverless bot tutorial](https://www.marclittlemore.com/serverless-telegram-chatbot-vercel/) for full deployment guidance.
