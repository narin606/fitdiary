import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitDiary — Food, without the friction",
  description: "A private nutrition diary with optional AI meal analysis.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
