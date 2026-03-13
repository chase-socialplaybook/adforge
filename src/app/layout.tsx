import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AdForge - Meta Ad Creative Generator",
  description:
    "Generate professional, ready-to-publish Meta ad creatives from competitor inspiration and your brand identity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${dmSans.variable} antialiased`}>
        <TooltipProvider>
          <Header />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        </TooltipProvider>
      </body>
    </html>
  );
}
