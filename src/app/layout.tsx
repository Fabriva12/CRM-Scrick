import type { Metadata } from "next";
import { League_Gothic, Roboto } from "next/font/google";
import { Shell } from "@/components/Shell";
import "./globals.css";

const leagueGothic = League_Gothic({
  variable: "--font-heading",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-sans",
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scrick CRM",
  description: "CRM para Scrick",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${leagueGothic.variable} ${roboto.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
