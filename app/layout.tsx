import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-space-grotesk",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "¿Quién cayó?",
  description: "Mirá cuándo coincidís con tus parceros en la U",
};

// La app se usa parada en un pasillo, con una mano. Es movil primero.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf3e4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
