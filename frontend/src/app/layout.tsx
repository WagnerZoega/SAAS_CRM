import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google";
import "./globals.css";

// const inter = Inter({
//   variable: "--font-inter",
//   subsets: ["latin"],
// });

// const rajdhani = Rajdhani({
//   variable: "--font-rajdhani",
//   weight: ["500", "700"],
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Manto PRO - Portal do Revendedor Elite",
  description: "O sistema definitivo para revendedores de camisas tailandesas. Catálogo, CRM e Notícias 24h.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
