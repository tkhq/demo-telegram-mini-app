import dotenv from "dotenv";
import { Bot, InlineKeyboard } from "grammy";
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Update } from "grammy/types";

dotenv.config()

const BOT_DOMAIN = process.env.PUBLIC_SITE_URL;
const BOT_TOKEN = process.env.BOT_TOKEN;

const bot = new Bot(BOT_TOKEN!);

const keyboard = new InlineKeyboard()
  .webApp("TurntCoin 🔑", BOT_DOMAIN!)

const replyText = "Welcome to TurntCoin - A demo mini app built on Turnkey 🔑🚀";

bot.on("message", async (ctx: any) => {
  await ctx.reply(replyText, {
    reply_markup: keyboard,
  })
})

bot.start();

export const startBot = async (req: VercelRequest, res: VercelResponse) => {
  if (!BOT_DOMAIN) {
    throw new Error('BOT_DOMAIN is not set.');
  }

  if (req.method === 'POST') {
    await bot.handleUpdate(req.body as unknown as Update);
  } else {
    res.status(200).json('Listening to bot events...');
  }
  res.status(200)
};
