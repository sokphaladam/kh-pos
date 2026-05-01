import type { Metadata } from "next";
import { Geist, Geist_Mono, Kantumruy_Pro } from "next/font/google";
import "./globals.css";
import getKnex from "@/lib/knex";

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

const defaultMetadata: Metadata = {
  title: "Point of Sale (POS) System",
  description:
    "L-POS stands for Point of Sale, which refers to the place and system where a retail transaction is completed. It typically involves both hardware and software used by businesses to process sales, accept payments, and manage related operations like inventory and customer data.",
  icons: {
    icon: "/api/favicon",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const db = await getKnex();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any[] = await db.table("setting").where({ warehouse: null });

    const brand = JSON.parse(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.find((f: any) => f.option === "BRAND")?.value || "{}",
    );

    if (!brand?.title) {
      return defaultMetadata;
    }

    return {
      title: brand.title,
      description: brand.description,
      icons: {
        icon: "/api/favicon",
      },
    };
  } catch (error) {
    console.log("Error fetching metadata:", error);
    return defaultMetadata;
  }
}

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
