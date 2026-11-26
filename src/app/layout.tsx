import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { Suspense } from "react";
import { BrowserGate } from "@/components/BrowserGate";
import { ServiceWorker } from "@/components/ServiceWorker";
import { Voki } from "@/components/Voki";
import "./globals.css";

const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], weight: ["400", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "VocaStar",
  description: "Vokabeln lernen mit Spaß: Spiele, Sterne und Voki die Eule.",
  applicationName: "VocaStar",
  appleWebApp: { capable: true, title: "VocaStar", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

function Loading() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-3">
      <Voki mood="happy" size={110} className="anim-float" />
      <p className="font-display text-xl text-ink-soft">VocaStar lädt …</p>
    </div>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${fredoka.variable} ${nunito.variable} antialiased`}>
      <body>
        <Suspense fallback={<Loading />}>
          <BrowserGate>{children}</BrowserGate>
        </Suspense>
        <ServiceWorker />
      </body>
    </html>
  );
}
