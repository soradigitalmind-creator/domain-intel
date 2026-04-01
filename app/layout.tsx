import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Domain Intel",
  description: "Research domains rendered as browseable topic maps and paper shelves."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
