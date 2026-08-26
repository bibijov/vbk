import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: "Veterinarska banka krvi",
    template: "%s · VBK",
  },
  description:
    "Prva veterinarska banka krvi u Srbiji — krvni produkti za veterinarske klinike i registar pasa donora.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sr" className={`${inter.variable} h-full`}>
      <body className="min-h-full">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
