import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Lina AI Studio",
  description: "AI production dashboard for Lina's Magic Land"
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
