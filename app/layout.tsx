import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = { title: "My Music", description: "Search, trending reels and background music" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#000000" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
