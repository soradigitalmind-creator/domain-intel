import type { Metadata } from "next";
import Link from "next/link";
import { HeaderMenu } from "./components/header-menu";
import { TrailProvider } from "./components/trail-context";
import "./globals.css";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: {
    default: "Domain Intel",
    template: "%s | Domain Intel",
  },
  description:
    "Browse research fields by category and explore topic maps, paper collections, and structured summaries for each domain.",
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <TrailProvider>
          <header className="site-header">
            <div className="site-header-inner page-shell">
              <Link href="/" className="site-logo">
                Domain Intel
              </Link>
              <HeaderMenu />
            </div>
          </header>
          {children}
        </TrailProvider>
      </body>
    </html>
  );
}
