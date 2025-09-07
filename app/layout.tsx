import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/SessionProvider";
import { ClientOnly } from "@/components/ClientOnly";
import { SubscriptionProvider } from "@/context/useSubscriptionContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hivedemia - Modern Educational Platform",
  description:
    "Improve productivity, learning, and collaboration with AI-powered student tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientOnly>
          <SessionProvider>
            <SubscriptionProvider>{children}</SubscriptionProvider>
          </SessionProvider>
          <Toaster />
        </ClientOnly>
      </body>
    </html>
  );
}
