import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '../components/ui/sonner';
import './globals.css';
import { Zap } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GridSense — Planifică consumul sustenabil de electricitate',
  description: 'Instrument inteligent pentru planificarea consumului de electricitate bazat pe energia curată din rețea',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro">
      <body className={inter.className}>
        <header className="bg-gradient-to-r from-emerald-600 to-green-600 border-b border-emerald-700 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-5 md:py-7">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold tracking-tight">GridSense</h1>
              <p className="text-emerald-50 text-sm">Consum inteligent, energie curată</p>
            </div>
          </div>
        </div>
      </header>
        {children}
        <Toaster position="top-right" />
        <footer className="mt-16 py-8 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-emerald-50">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p className="font-semibold text-emerald-700">
            GridSense © 2025 — Green Greed
          </p>
          <p className="mt-2 text-gray-500">
            🌱 Consum inteligent bazat pe energie regenerabilă din rețeaua națională
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Scor sustenabilitate 0–100 (scor mai mare = mai multă energie curată)
          </p>
        </div>
      </footer>
      </body>
    </html>
  );
}
