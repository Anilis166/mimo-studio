import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MimoStudio — Sketch to working app",
  description:
    "Drop a UI screenshot or describe an idea — Xiaomi MiMo (Omni + Pro + TTS) builds a polished React app with auto-generated tests for closed-loop verification.",
  openGraph: {
    title: "MimoStudio",
    description:
      "Sketch → working React app, powered by Xiaomi MiMo-V2 (Omni + Pro + TTS).",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  );
}
