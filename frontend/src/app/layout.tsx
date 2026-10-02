import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Lean Mode — Consistency Over Perfection",
    template: "%s | Lean Mode",
  },
  description: "Personal habit tracker untuk transformasi tubuh lean. Tracking harian, kalori, dan progres menuju tubuh ideal.",
  icons: { icon: "/Logo_LeanMode.ico" },
};

export const viewport = {
  themeColor: "#f8fafc",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
