"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Leaf } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  return (
    <main className="support-page">
      <div className="login-container">
        <Link href="/" className="back-link">
          <ArrowLeft size={14} /> Înapoi la energia ta
        </Link>
        <span className="dialog-icon" style={{ marginBottom: 24 }}>
          <Leaf size={27} />
        </span>
        <span className="eyebrow">LOCUL TĂU ÎNTR-UN VIITOR VERDE</span>
        <h1 style={{ marginTop: 12 }}>Bine ai venit acasă.</h1>
        <p className="support-description">
          Descoperă cum ar putea arăta energia ta, conectată la comunitate.
        </p>
        <div className="login-card">
          <h2 style={{ fontSize: 18 }}>Încearcă un cont demonstrativ</h2>
          <p
            className="support-note"
            style={{ marginTop: 13, marginBottom: 24 }}
          >
            Portofel, comunitate și un consum mai inteligent, într-un singur
            loc. Poți explora fără date personale sau parolă.
          </p>
          <button
            className="button forest-button"
            onClick={() => router.push("/#acasa")}
          >
            Intră în modul explorare <ArrowRight size={16} />
          </button>
        </div>
        <p className="support-note">
          Autentificarea reală nu este încă disponibilă. Datele portofelului
          demo sunt salvate doar în browserul tău.
        </p>
      </div>
    </main>
  );
}
