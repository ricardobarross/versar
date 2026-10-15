import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { siteUrl } from "@/lib/site";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: { default: "VERSAR — Moda masculina", template: "%s | VERSAR" },
  description: "Moda masculina com atitude. Camisas, calças, bermudas e acessórios com entrega para todo o Brasil.",
  metadataBase: new URL(siteUrl()),
  openGraph: { type: "website", locale: "pt_BR", siteName: "VERSAR" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
