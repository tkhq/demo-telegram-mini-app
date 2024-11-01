# Turntkey Demo Telegram Mini App

This example app contains an example Telegram mini-app built on Turnkey.

`/bot` - Contains code that runs a Telegram Bot\
`/src` - Contains a next js application that can run a miniapp in a Telegram Context
- Note the `<script src="https://telegram.org/js/telegram-web-app.js"></script>` in the `<head>` of /src/app/layout.tsx. This allows us to use Telegram mini-app utilities such as [Telegram Cloud Storage](https://core.telegram.org/bots/webapps#cloudstorage)

`/src/app/api` - Contains routes that your server would perform. This includes things like creating sub organizations whennew users join, or kicking off email authentication for when they want to log in\
`/src/app/email-auth` - Shows how the `@turnkey/telegram-cloud-storage-stamper` can be used to store a temporary (or long lived) api key to use within your application and make requests to Turnkey on behalf of your users\
`/src/app/wallet` - Shows how that stored api key can be retreived and used to make requests to Turnkey, for example signing and broadcasting a transaction
