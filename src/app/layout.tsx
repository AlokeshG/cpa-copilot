import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loopnow CPA Copilot",
  description: "AI-powered Canadian bookkeeping and GST/HST compliance assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}