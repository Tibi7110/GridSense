import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '../components/ui/sonner';
import './globals.css';
import { Zap } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Plan Consum — Planifică consumul de electricitate',
  description: 'Instrument pentru planificarea consumului de electricitate după scorul de favorabilitate (0–100)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro">
      <body className={inter.className}>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2E8540] rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-gray-900">Plan Consum</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Planifică consumul de electricitate după scorul de favorabilitate
          </p>
        </div>
      </header>
        {children}
        <Toaster position="top-right" />
        <footer className="mt-16 py-8 border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>
            Green Greed © 2025 — Instrument pentru planificarea consumului de
            electricitate
          </p>
          <p className="mt-2">
            Scor 0–100 (mai mare = mai favorabil pentru consum)
          </p>
        </div>
      </footer>
      </body>
    </html>
  );
}
