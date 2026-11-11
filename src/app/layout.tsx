import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/session";
import { getLocale } from "@/lib/i18n";
import { OfflineBanner } from "@/components/offline-banner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["600", "700"] });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", weight: ["400", "600"] });

export const metadata: Metadata = {
  title: "Andy Electric · Material management",
  description: "Material per project, warehouse and van inventory, shortages and purchasing.",
};

export const viewport: Viewport = { themeColor: "#21241e" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const locale = user?.locale ?? (await getLocale());
  return (
    <html lang={locale} className={`${inter.variable} ${montserrat.variable}`}>
      <body className="min-h-dvh antialiased">
        <OfflineBanner locale={locale} />
        {children}
      </body>
    </html>
  );
}
