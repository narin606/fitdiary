import type { Metadata } from "next";
import "./globals.css";
import "./auth.css";
import "./product.css";
import { AuthProvider } from "../contexts/AuthContext";

export const metadata: Metadata = {
  title: "FitDiary — Food, without the friction",
  description: "A private nutrition diary with optional AI meal analysis.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><AuthProvider>{children}</AuthProvider></body></html>;
}
