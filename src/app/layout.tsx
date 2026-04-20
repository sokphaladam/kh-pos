import type { Metadata } from "next";
import { Geist, Geist_Mono, Kantumruy_Pro } from "next/font/google";
import "./globals.css";

const latin = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});
const khmer = Kantumruy_Pro({
  subsets: ["khmer"],
  variable: "--font-kantumruy-pro",
});

export const metadata: Metadata = {
  title: "L-POS",
  description:
    "L-POS stands for Point of Sale, which refers to the place and system where a retail transaction is completed. It typically involves both hardware and software used by businesses to process sales, accept payments, and manage related operations like inventory and customer data.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
      </head>
      <body
        className={`${khmer.variable} ${latin.variable} ${mono.variable} antialiased flex-1`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
