import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "GridSense — Energie bună, împreună",
  description:
    "Descoperă energia comunității tale, explorează portofelul de kWh și alege un moment mai bun pentru consum.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro">
      <body className={inter.variable}>
        <AppShell>{children}</AppShell>
        <Toaster position="bottom-right" theme="light" />
      </body>
    </html>
  );
}
