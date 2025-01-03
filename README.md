# Turnkey Demo Telegram Mini App

This example app contains an example Telegram mini-app built on Turnkey.

## About

This example mini app demonstrates how you can create a seamless wallet experience for your users via Telegram mini apps. End users can authenticate with email, social login, or even just their Telegram login. This enables developers to easily onboard users and allow users to make multiple Turnkey requests within their session without additional authentication steps.

Under the hood, this Next.js application uses Turnkey’s [TelegramCloudStorageStamper](https://github.com/tkhq/sdk/tree/main/packages/telegram-cloud-storage-stamper) and Telegram's [CloudStorage](https://core.telegram.org/bots/webapps#cloudstorage) to create and store API key authenticators. These authenticators enable client-side stamping of requests to Turnkey without exposing credentials to the app developers. Note that this approach does require trusting Telegram’s infrastructure.

## Code Structure

`/bot` - Contains code that runs a Telegram Bot\
`/src` - Contains a next js application that can run a miniapp in a Telegram Context
- Note the `<script src="https://telegram.org/js/telegram-web-app.js"></script>` in the `<head>` of /src/app/layout.tsx. This allows us to use Telegram mini-app utilities such as [Telegram Cloud Storage](https://core.telegram.org/bots/webapps#cloudstorage)

`/src/app/api` - Contains routes that your server would perform. This includes things like creating sub organizations whennew users join, or kicking off email authentication for when they want to log in\
`/src/app/auth` - Shows how the `@turnkey/telegram-cloud-storage-stamper` can be used to store a temporary (or long lived) api key to use within your application and make requests to Turnkey on behalf of your users\
`/src/app/wallet` - Shows how that stored api key can be retreived and used to make requests to Turnkey, for example signing and broadcasting a transaction
