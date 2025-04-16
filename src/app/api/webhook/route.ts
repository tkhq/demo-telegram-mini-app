'use server'

import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.PUBLIC_SITE_URL;

// Keep a singleton bot instance
const bot = new TelegramBot(token, { polling: false });

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.message) {
      const { chat: { id }, text } = body.message;

      const message = `Non-custodial demo wallet, powered by Turnkey 🔑`;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "Launch app",
              web_app: {
                url: webAppUrl,
              },
            },
          ],
        ],
      };

      await bot.sendMessage(id, message, {
        reply_markup: keyboard,
      });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Error handling Telegram webhook:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
