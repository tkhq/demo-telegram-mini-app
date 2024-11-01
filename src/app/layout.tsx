import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Turnkey demo Telegram Mini App",
  description: "Turnkey demo Telegram Mini App",
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
