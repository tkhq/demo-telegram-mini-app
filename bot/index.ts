import dotenv from "dotenv";
import { Bot, InlineKeyboard } from "grammy";

dotenv.config()

const BOT_DOMAIN = process.env.PUBLIC_SITE_URL;
const BOT_TOKEN = process.env.BOT_TOKEN;

const bot = new Bot(BOT_TOKEN!);

const labelDataPairs = [
  ["Degen Trading App (Internal to Telegram)", BOT_DOMAIN!]
];

const keyboard = new InlineKeyboard()
  .webApp("TurntCoin 🔑", BOT_DOMAIN!)

const replyText = "Welcome to TurntCoin - A demo mini app built on Turnkey 🔑🚀";

bot.on("message", async (ctx) => {
  await ctx.reply(replyText, {
    reply_markup: keyboard,
  })
})

bot.start();