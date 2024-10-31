// Check out this article on how to deploy a bot with serverless functions with vercel!: https://www.marclittlemore.com/serverless-telegram-chatbot-vercel/
// Require our Telegram helper package
const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv')

dotenv.config()

// Export as an asynchronous function
// We'll wait until we've responded to the user
module.exports = async (request, response) => {
    try {
        // Create our new bot handler with the token
        // that the Botfather gave us
        // Use an environment variable so we don't expose it in our code
        const bot = new TelegramBot(process.env.TELEGRAM_TOKEN);

        console.log(process.env.PUBLIC_SITE_URL)

        // Retrieve the POST request body that gets sent from Telegram
        const { body } = request;

        // Ensure that this is a message being sent
        if (body.message) {
            // Retrieve the ID for this chat
            // and the text that the user sent
            const { chat: { id }, text } = body.message;

            // Create a message to send back
            // We can use Markdown inside this
            const message = `Welcome to TurntCoin - A demo mini app built on Turnkey 🔑🚀`;
            // Create the inline keyboard
            const keyboard = {
                inline_keyboard: [
                [
                    {
                    text: "TurntCoin 🔑",
                    web_app: {
                        url: process.env.PUBLIC_SITE_URL
                    },
                    }
                ]
                ]
            };

            // Send our new message back in Markdown and
            // wait for the request to finish
            await bot.sendMessage(id, message, {
                reply_markup: keyboard
            });
        }
    }
    catch(error) {
        // If there was an error sending our message then we 
        // can log it into the Vercel console
        console.error('Error sending message');
        console.log(error.toString());
    }
    
    // Acknowledge the message with Telegram
    // by sending a 200 HTTP status code
    // The message here doesn't matter.
    response.send('OK');
};