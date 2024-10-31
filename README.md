# TurntCoin 🔑 Demo Telegram Mini App

## ***NOTE: TurntCoins nor devnet Solana have any real value nor will in the future

This example app contains an example Telegram mini-app built on Turnkey.

`/bot` Contains code that runs a Telegram Bot\
`/src` Contains a next js application that can run a miniapp in a Telegram Context
- Note the `<script src="https://telegram.org/js/telegram-web-app.js"></script>` in the `<head>` of /src/app/layout.tsx. This allows us to use Telegram mini-app utilities such as [Telegram Cloud Storage](https://core.telegram.org/bots/webapps#cloudstorage).
