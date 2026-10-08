import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, Leaf } from "lucide-react";

const plans = [
  {
    name: "Gratuit",
    price: "0",
    caption: "UN ÎNCEPUT MAI VERDE",
    features: [
      "Scorul de sustenabilitate al energiei",
      "3 intervale recomandate",
      "Export în calendar",
    ],
    action: "Explorează gratuit",
    href: "/#energie",
  },
  {
    name: "Pro",
    price: "19",
    caption: "MAI MULT PENTRU CASA TA",
    features: [
      "Programare automată a consumului",
      "Notificări pentru intervalele verzi",
      "Istoric de consum pe 30 de zile",
    ],
    action: "Explorează funcțiile demo",
    href: "/#portofel",
    featured: true,
  },
  {
    name: "Business",
    price: "49",
    caption: "CREȘTEM ÎMPREUNĂ",
    features: [
      "Mai multe dispozitive, un singur loc",
      "Integrare prin API",
      "Suport pentru comunitatea ta",
    ],
    action: "Descoperă comunitatea",
    href: "/#comunitate",
  },
];

export default function AbonamentePage() {
  return (
    <main className="support-page">
      <Link href="/" className="back-link">
        <ArrowLeft size={14} /> Înapoi la energia ta
      </Link>
      <span className="eyebrow">ENERGIE BUNĂ, ÎN RITMUL TĂU</span>
      <h1 style={{ marginTop: 12 }}>Un plan pentru fiecare pas.</h1>
      <p className="support-description">
        De la primele alegeri sustenabile la o întreagă comunitate conectată.
      </p>
      <div className="pricing-grid">
        {plans.map((plan) => (
          <article
            className={`pricing-card ${plan.featured ? "featured" : ""}`}
            key={plan.name}
          >
            <span className="plan-label">{plan.caption}</span>
            <h2>
              {plan.name}{" "}
              {plan.featured && (
                <Leaf size={17} style={{ display: "inline", marginLeft: 8 }} />
              )}
            </h2>
            <div className="price">
              {plan.price} <span>RON / lună</span>
            </div>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>
                  <Check size={14} />
                  {feature}
                </li>
              ))}
            </ul>
            <Link href={plan.href} className="button forest-button">
              {plan.action}
              <ArrowUpRight size={15} />
            </Link>
          </article>
        ))}
      </div>
      <p className="support-note">
        Planuri propuse pentru previzualizare. Funcțiile Pro și Business nu sunt
        încă activate; explorarea demo nu creează un abonament și nu implică
        plăți.
      </p>
    </main>
  );
}
