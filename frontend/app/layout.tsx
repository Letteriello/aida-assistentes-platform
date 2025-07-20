import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "../styles/cross-browser.css";
import { Providers } from "@/components/providers";
import { PageTransition } from "@/components/ui/page-transition";
import { DeviceInitializer } from "@/components/ui/device-initializer";
import { PWAManager } from "@/components/ui/pwa-manager";
import { metadata as baseMetadata, viewport } from "./metadata";

export { viewport };
export const metadata = baseMetadata;

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark scheme-only-dark">
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased min-h-screen-mobile`}
      >
        <DeviceInitializer />
        <Providers>
          <PageTransition>
            {children}
          </PageTransition>
          <PWAManager />
        </Providers>
      </body>
    </html>
  );
}