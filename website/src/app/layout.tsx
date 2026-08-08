import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
  display: "swap",
});

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kuro — a free pixel cat for your desktop",
  description:
    "Kuro is a tiny open-source pixel cat that lives on your desktop. It follows your cursor, kneads when you type, and reminds you to stretch. Free forever — macOS, Windows, Linux.",
  openGraph: {
    title: "Kuro — a free pixel cat for your desktop",
    description:
      "Follows your cursor, kneads when you type, hops when your AI agent finishes. Free & open source.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kuro — a free pixel cat for your desktop",
    description:
      "Follows your cursor, kneads when you type, hops when your AI agent finishes. Free & open source.",
  },
};

export const viewport = {
  themeColor: "#131019",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${pressStart.variable} ${vt323.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
