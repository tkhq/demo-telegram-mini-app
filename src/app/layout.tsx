import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TurntCoin Telegram Mini App",
  description: "TurntCoin Telegram Mini App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
      </head>
      <body
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
