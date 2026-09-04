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

// El link se comparte por WhatsApp, asi que la vista previa ES la portada de
// la app: es lo unico que ve alguien antes de decidir si entra. La imagen sale
// de app/opengraph-image.jpeg por convencion de archivo — Next arma las
// etiquetas con la URL absoluta y el tamaño, que es justo lo que WhatsApp
// necesita y lo que una ruta relativa no le sirve.
export const metadata: Metadata = {
  title: "¿Quién cayó?",
  description: "Mirá cuándo coincidís con tus parceros en la U",
  openGraph: {
    type: "website",
    siteName: "¿Quién cayó?",
    title: "¿Quién cayó?",
    description: "Mirá cuándo coincidís con tus parceros en la U",
    locale: "es_CO",
  },
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
