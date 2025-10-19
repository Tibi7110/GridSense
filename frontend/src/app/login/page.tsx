"use client";
import React from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Demo only: no real auth backend yet
      await new Promise((r) => setTimeout(r, 600));
      alert("Autentificat (demo)");
    } finally {
      setLoading(false);
    }
  };
  return (
  <main className="max-w-md mx-auto px-4 py-10 min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="mb-4">
        <Link href="/" className="inline-flex items-center text-sm text-emerald-700 hover:text-emerald-900 hover:underline">
          ← Înapoi
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Autentificare</h1>
      <form onSubmit={onSubmit} className="space-y-4 bg-white border rounded-lg p-6 shadow-sm">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="exemplu@email.com"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Parolă</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Se conectează…" : "Conectează-te"}
        </button>
      </form>
      {/* Disclaimer removed per request */}
    </main>
  );
}
