import type { Metadata } from "next";
import Link from "next/link";
import { MenuButton, MenuProvider, SearchButton, SidebarPanel } from "./components/header-menu";
import { TrailProvider } from "./components/trail-context";
import { listPortalCategories } from "../lib/workplace";
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

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const categories = await listPortalCategories();
  const navCategories = categories.map((c) => ({ slug: c.slug, label: c.label }));

  return (
    <html lang="en">
      <body>
        <TrailProvider>
          <MenuProvider>
            <header className="site-header">
              <div className="site-header-inner page-shell">
                <Link href="/" className="site-logo">
                  Domain Intel
                </Link>
                <div className="site-header-actions">
                  <SearchButton />
                  <MenuButton />
                </div>
              </div>
            </header>
            <SidebarPanel categories={navCategories} />
            {children}
          </MenuProvider>
        </TrailProvider>
      </body>
    </html>
  );
}
