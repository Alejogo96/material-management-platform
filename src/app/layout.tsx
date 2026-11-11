import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["600", "700"] });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", weight: ["400", "600"] });

export const metadata: Metadata = {
  title: "Andy Electric · Gestión de material",
  description: "Material por proyecto, inventario de bodega y vans, faltantes y compras.",
};

export const viewport: Viewport = { themeColor: "#21241e" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${montserrat.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
