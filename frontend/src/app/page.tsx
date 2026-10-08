"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Heart,
  Leaf,
  MapPin,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sprout,
  Sun,
  Trees,
  Trophy,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { EnergyVillage } from "@/components/EnergyVillage";
import { EnergyPlanner } from "@/components/EnergyPlanner";

const format = (number: number, digits = 1) =>
  new Intl.NumberFormat("ro-RO", { maximumFractionDigits: digits }).format(
    number,
  );
const storageKey = "gridsense-community-demo-v1";
type Transaction = {
  id: string;
  title: string;
  detail: string;
  amount: number;
  date: string;
};
type WalletState = {
  balance: number;
  shared: number;
  transactions: Transaction[];
};
const initialWallet: WalletState = {
  balance: 384.6,
  shared: 75,
  transactions: [
    {
      id: "initial-1",
      title: "Surplus de energie",
      detail: "Producție din panouri solare",
      amount: 43,
      date: "6 oct. · 14:30",
    },
    {
      id: "initial-2",
      title: "Către comunitate",
      detail: "Fondul comun Dealul Soarelui",
      amount: -25,
      date: "5 oct. · 10:15",
    },
    {
      id: "initial-3",
      title: "Energie primită",
      detail: "De la Andrei M.",
      amount: 15,
      date: "4 oct. · 16:42",
    },
  ],
};
const memberData = [
  {
    name: "Ioan Munteanu",
    initials: "IM",
    role: "Prosumator",
    info: "Panouri solare · 10 kWp",
    amount: 212.4,
    color: "sand",
  },
  {
    name: "Școala din Deal",
    initials: "ȘD",
    role: "Instituție",
    info: "Energie pentru educație",
    amount: 168,
    color: "lavender",
  },
  {
    name: "Tu, în comunitate",
    initials: "TU",
    role: "Prosumator",
    info: "Profil demonstrativ · prosumator",
    amount: 75,
    color: "mint",
    me: true,
  },
  {
    name: "Elena Popescu",
    initials: "EP",
    role: "Consumator",
    info: "O casă mai verde",
    amount: -64,
    color: "rose",
  },
];

function validWallet(value: unknown): value is WalletState {
  if (!value || typeof value !== "object") return false;
  const wallet = value as WalletState;
  return (
    Number.isFinite(wallet.balance) &&
    wallet.balance >= 0 &&
    Number.isFinite(wallet.shared) &&
    wallet.shared >= 0 &&
    Array.isArray(wallet.transactions) &&
    wallet.transactions.every(
      (tx) =>
        typeof tx.id === "string" &&
        typeof tx.title === "string" &&
        typeof tx.detail === "string" &&
        Number.isFinite(tx.amount) &&
        typeof tx.date === "string",
    )
  );
}

export default function Page() {
  const [wallet, setWallet] = useState<WalletState>(initialWallet);
  const [ready, setReady] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [amount, setAmount] = useState("25");
  const [recipient, setRecipient] = useState("Fondul comun Dealul Soarelui");
  const [transferError, setTransferError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Toți membrii");
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [activityFilter, setActivityFilter] = useState("Toate");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (validWallet(saved)) setWallet(saved);
    } catch {
      /* A fresh demo also works without browser storage. */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(wallet));
      } catch {
        /* Keep the session usable when storage is unavailable. */
      }
    }
  }, [wallet, ready]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (transferOpen) {
      dialog?.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog?.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [transferOpen]);

  function openTransfer() {
    setTransferError("");
    submitting.current = false;
    setTransferOpen(true);
  }
  function transfer(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    const quantity = Number(amount.replace(",", "."));
    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      quantity > wallet.balance ||
      Math.abs(quantity * 10 - Math.round(quantity * 10)) > 0.00001
    ) {
      setTransferError(
        "Introdu o cantitate pozitivă, cu cel mult o zecimală, în limita soldului.",
      );
      return;
    }
    submitting.current = true;
    const tx = {
      id: crypto.randomUUID(),
      title:
        recipient === "Fondul comun Dealul Soarelui"
          ? "Către comunitate"
          : `Către ${recipient}`,
      detail: "Transfer demonstrativ · fără tranzacție reală",
      amount: -quantity,
      date: new Date().toLocaleString("ro-RO", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setWallet((previous) => ({
      balance: Math.round((previous.balance - quantity) * 10) / 10,
      shared:
        Math.round(
          (previous.shared +
            (recipient === "Fondul comun Dealul Soarelui" ? quantity : 0)) *
            10,
        ) / 10,
      transactions: [tx, ...previous.transactions],
    }));
    setTransferOpen(false);
    toast.success(`${format(quantity)} kWh partajați în simulare`, {
      description: `Către ${recipient}. Portofelul demo a fost actualizat.`,
    });
  }
  function exportHistory() {
    const rows = [
      ["Data", "Descriere", "Cantitate kWh"],
      ...wallet.transactions.map((tx) => [
        tx.date,
        tx.title,
        String(tx.amount),
      ]),
    ];
    const csv =
      "\uFEFF" +
      rows
        .map((row) =>
          row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","),
        )
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "gridsense-activitate-demo.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const members = memberData.filter(
    (member) =>
      (filter === "Toți membrii" || member.role === filter) &&
      member.name
        .toLocaleLowerCase("ro")
        .includes(search.toLocaleLowerCase("ro")),
  );
  const transactions = wallet.transactions.filter(
    (tx) =>
      activityFilter === "Toate" ||
      (activityFilter === "Primite" ? tx.amount > 0 : tx.amount < 0),
  );
  const communityTotal = 1248 + wallet.shared - 75;
  const progress = Math.min(100, (communityTotal / 2000) * 100);

  return (
    <main className="dashboard" id="acasa">
      <div className="page-heading">
        <div>
          <div className="eyebrow greeting">BINE AI VENIT ÎN GRIDSENSE</div>
          <h1>
            Energia ta. Impactul nostru<span>.</span>
          </h1>
          <p>
            Consum inteligent pentru orice casă, cu sau fără panouri solare.
          </p>
        </div>
        <span className="demo-badge">
          <span /> Comunitate și portofel · demo
        </span>
      </div>

      <section className="hero-card" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="hero-kicker">
            <span /> CONSUM INTELIGENT, ENERGIE CURATĂ
          </span>
          <h2 id="hero-title">
            Același consum.
            <br />
            Un moment <em>mai bun.</em>
          </h2>
          <p>
            Alege când consumi. Redu impactul.
            <br />
            Energia din rețea contează, chiar dacă nu ai panouri.
          </p>
          <a href="#energie" className="button lime-button">
            Planifică-mi consumul <ArrowUpRight size={18} />
          </a>
          <div className="hero-proof">
            <div className="avatar-stack">
              <span>AM</span>
              <span>EP</span>
              <span>IM</span>
              <span>+21</span>
            </div>
            <span>
              Pentru orice casă. <strong>Fiecare alegere contează.</strong>
            </span>
          </div>
        </div>
        <div className="hero-art">
          <EnergyVillage />
          <div className="solar-label">
            <span className="solar-label-icon">
              <Sun size={19} />
            </span>
            <div>
              <strong>Mai multă energie curată în rețea.</strong>
              <span>Consum mai bine planificat, pentru toți</span>
            </div>
          </div>
        </div>
      </section>

      <EnergyPlanner />

      <section className="prosumer-section" id="portofel">
        <div className="prosumer-intro">
          <span className="eyebrow">ȘI DACĂ PRODUCI ENERGIE</span>
          <h2>Un loc și pentru prosumatori.</h2>
          <p>
            Planificarea consumului este pentru toată lumea, indiferent dacă ai
            panouri solare. Dacă produci și energie, poți explora separat
            portofelul de kWh și partajarea în comunitate.
          </p>
          <span className="demo-badge">
            Portofel și transferuri demonstrative
          </span>
        </div>
        <section className="wallet-card">
          <div className="wallet-heading">
            <span>
              <Wallet size={18} /> Portofelul tău verde
            </span>
            <span className="wallet-demo">DEMO</span>
          </div>
          <p>Energia ta, plină de posibilități</p>
          <div className="wallet-balance">
            {format(wallet.balance)} <span>kWh</span>
          </div>
          <span className="balance-label">
            <span /> Sold disponibil în simulare
          </span>
          <div className="wallet-rule" />
          <div className="wallet-detail">
            <span>
              <ArrowDownLeft size={16} /> Ultimul surplus creditat
            </span>
            <strong>+43 kWh</strong>
          </div>
          <button className="button forest-button" onClick={openTransfer}>
            Partajează energie <ArrowUpRight size={17} />
          </button>
          <a href="#activitate" className="wallet-history">
            Vezi istoricul portofelului <ArrowRight size={14} />
          </a>
          <Leaf
            className="wallet-watermark"
            size={180}
            strokeWidth={0.7}
            aria-hidden="true"
          />
        </section>
      </section>

      <section id="comunitate" className="community-section">
        <div className="section-toolbar">
          <div>
            <span className="eyebrow">PUTEREA LUI ÎMPREUNĂ</span>
            <h2>Comunitatea ta. Un impact mai mare.</h2>
          </div>
          <span className="community-location">
            <MapPin size={14} /> Dealul Soarelui · comunitate demo
          </span>
        </div>
        <div className="community-grid">
          <div className="panel community-panel">
            <div className="community-heading">
              <span className="community-logo">
                <HouseCommunity />
              </span>
              <div>
                <h3>Dealul Soarelui</h3>
                <p>Vecini care împart mai mult decât o stradă.</p>
              </div>
              <span className="member-badge">
                <span /> 24 membri
              </span>
            </div>
            <div className="community-stats">
              <div>
                <strong>
                  {format(communityTotal, 0)}
                  <small> kWh</small>
                </strong>
                <span>energie partajată</span>
              </div>
              <div>
                <strong>
                  {format(wallet.shared)}
                  <small> kWh</small>
                </strong>
                <span>contribuția ta</span>
              </div>
              <div>
                <strong>
                  324<small> kg</small>
                </strong>
                <span>CO₂ evitat · demo</span>
              </div>
            </div>
            <div className="members-toolbar">
              <h4>Oameni cu energie bună</h4>
              <a href="#membri">
                Vezi membrii <ChevronRight size={15} />
              </a>
            </div>
            <div className="member-preview">
              {memberData.slice(0, 3).map((member) => (
                <div key={member.initials}>
                  <span className={`avatar ${member.color}`}>
                    {member.initials}
                  </span>
                  <span>{member.me ? "Tu" : member.name.split(" ")[0]}</span>
                  <strong>
                    {format(member.me ? wallet.shared : member.amount)}{" "}
                    <small>kWh</small>
                  </strong>
                </div>
              ))}
            </div>
            <div className="community-footer">
              <span>
                <Heart size={15} /> Energia împărțită se simte altfel.
              </span>
              <button className="text-button" onClick={openTransfer}>
                Contribuie <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
          <article className="challenge-card">
            <div className="challenge-top">
              <span>
                <Trophy size={16} /> PROVOCAREA LUNII
              </span>
              <span className="challenge-month">OCTOMBRIE</span>
            </div>
            <div className="challenge-illustration">
              <Trees size={68} strokeWidth={1.15} />
              <span className="challenge-star star-one">✦</span>
              <span className="challenge-star star-two">✧</span>
            </div>
            <h3>Mai verde, împreună.</h3>
            <p>
              Hai să partajăm 2.000 kWh de energie în comunitate luna aceasta.
            </p>
            <div className="progress-label">
              <strong>
                {format(communityTotal, 0)} <span>/ 2.000 kWh</span>
              </strong>
              <span>{Math.round(progress)}%</span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Obiectivul comunității"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div style={{ width: `${progress}%` }} />
            </div>
            <span className="challenge-bottom">
              <Sprout size={14} />{" "}
              {progress >= 100
                ? "Obiectiv atins! Fiecare contribuție contează."
                : "Fiecare contribuție ne aduce mai aproape."}
            </span>
          </article>
        </div>
      </section>

      <div className="details-grid">
        <section className="panel members-panel" id="membri">
          <div className="panel-heading">
            <div>
              <h2>Cunoaște-ți comunitatea</h2>
              <p>O mică parte din comunitatea noastră demo.</p>
            </div>
            <Users size={20} />
          </div>
          <div className="member-filters">
            <label className="search-input">
              <Search size={16} />
              <input
                aria-label="Caută un membru"
                placeholder="Caută un vecin…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <div className="select-wrap">
              <select
                aria-label="Filtrează membrii"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option>Toți membrii</option>
                <option>Prosumator</option>
                <option>Consumator</option>
                <option>Instituție</option>
              </select>
              <ChevronDown size={14} />
            </div>
          </div>
          <div className="member-list">
            {members.length ? (
              members.map((member) => (
                <div className="member-row" key={member.name}>
                  <span className={`avatar ${member.color}`}>
                    {member.initials}
                  </span>
                  <div>
                    <strong>{member.name}</strong>
                    <span>{member.info}</span>
                  </div>
                  <span
                    className={
                      member.amount > 0 ? "amount-positive" : "amount-neutral"
                    }
                  >
                    {member.amount > 0 ? "+" : ""}
                    {format(member.me ? wallet.shared : member.amount)}
                    <small> kWh</small>
                  </span>
                </div>
              ))
            ) : (
              <p className="empty-state">
                Niciun membru nu se potrivește căutării.
              </p>
            )}
          </div>
        </section>
        <section className="panel activity-panel" id="activitate">
          <div className="panel-heading">
            <div>
              <h2>Energia merge mai departe</h2>
              <p>Activitatea portofelului tău demonstrativ.</p>
            </div>
            <button
              className="icon-button"
              onClick={exportHistory}
              aria-label="Descarcă istoricul CSV"
              title="Descarcă CSV"
            >
              <ArrowDownToLine size={19} />
            </button>
          </div>
          <div className="activity-tabs">
            {["Toate", "Primite", "Trimise"].map((value) => (
              <button
                key={value}
                className={activityFilter === value ? "active" : ""}
                aria-pressed={activityFilter === value}
                onClick={() => setActivityFilter(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="transaction-list">
            {(historyExpanded ? transactions : transactions.slice(0, 3)).map(
              (tx) => (
                <div className="transaction-row" key={tx.id}>
                  <span
                    className={`transaction-icon ${tx.amount > 0 ? "mint" : "sand"}`}
                  >
                    {tx.amount > 0 ? (
                      <ArrowDownLeft size={19} />
                    ) : (
                      <ArrowUpRight size={19} />
                    )}
                  </span>
                  <div>
                    <strong>{tx.title}</strong>
                    <span>{tx.date}</span>
                  </div>
                  <span
                    className={
                      tx.amount > 0 ? "amount-positive" : "amount-neutral"
                    }
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {format(tx.amount)}
                    <small> kWh</small>
                  </span>
                </div>
              ),
            )}
            {transactions.length === 0 && (
              <p className="empty-state">
                Nu există tranzacții în această categorie.
              </p>
            )}
          </div>
          {transactions.length > 3 && (
            <button
              className="text-button all-activity"
              onClick={() => setHistoryExpanded(!historyExpanded)}
            >
              {historyExpanded
                ? "Arată mai puțin"
                : `Vezi toate cele ${transactions.length} tranzacții`}
              <ArrowRight size={15} />
            </button>
          )}
        </section>
      </div>

      <section className="how-it-works" id="cum-functioneaza">
        <div>
          <span className="eyebrow">MAI SIMPLU DECÂT CREZI</span>
          <h2>Obiceiuri mici. Schimbări mari.</h2>
        </div>
        <div className="how-grid">
          {[
            {
              icon: Sun,
              title: "Urmărește energia",
              text: "Urmărește scorul de sustenabilitate al rețelei și compară intervalele zilei, chiar dacă nu produci energie.",
            },
            {
              icon: Send,
              title: "Mută momentul consumului",
              text: "Alege un aparat, durata și ora obișnuită. Vezi cum se schimbă scorul și impactul estimat când muți consumul.",
            },
            {
              icon: Leaf,
              title: "Alege un moment mai bun",
              text: "Consultă previziunile disponibile și salvează intervalul ales în calendarul tău.",
            },
          ].map((item, i) => (
            <article key={item.title}>
              <span className="how-number">0{i + 1}</span>
              <item.icon size={22} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
        <details className="demo-explanation">
          <summary>
            <CircleHelp size={16} /> Ce înseamnă modul explorare?
            <Plus size={16} />
          </summary>
          <p>
            Portofelul, comunitatea și transferurile sunt o simulare inspirată
            de conceptul Portofel kWh. Nu se transferă energie și nu se
            efectuează plăți reale. Planificatorul utilizează previziunile
            generate de model.py din fișierul Excel. Dacă previziunile nu pot fi
            citite, afișează o eroare, fără scoruri demonstrative. Exportul în
            calendar nu programează automat aparatul.
          </p>
          <button
            className="text-button"
            onClick={() => {
              setWallet(initialWallet);
              toast.success("Portofelul demo a fost resetat.");
            }}
          >
            Resetează portofelul demo <ArrowRight size={14} />
          </button>
        </details>
      </section>

      <dialog
        ref={dialogRef}
        className="transfer-dialog"
        onCancel={() => setTransferOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const bounds = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < bounds.left ||
              event.clientX > bounds.right ||
              event.clientY < bounds.top ||
              event.clientY > bounds.bottom
            )
              setTransferOpen(false);
          }
        }}
        aria-labelledby="transfer-title"
      >
        <form onSubmit={transfer}>
          <div className="dialog-top">
            <span className="dialog-icon">
              <Send size={25} />
            </span>
            <button
              className="icon-button"
              type="button"
              aria-label="Închide transferul"
              onClick={() => setTransferOpen(false)}
            >
              <X size={21} />
            </button>
          </div>
          <span className="eyebrow">UN GEST MIC. O ENERGIE MARE.</span>
          <h2 id="transfer-title">Dă energia mai departe.</h2>
          <p>Simulează un transfer din portofelul tău verde.</p>
          <label htmlFor="recipient">Către cine trimiți?</label>
          <select
            id="recipient"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
          >
            <option>Fondul comun Dealul Soarelui</option>
            <option>Elena Popescu</option>
            <option>Apartamentul meu</option>
          </select>
          <label htmlFor="transfer-amount">
            Câtă energie vrei să partajezi?
          </label>
          <div className="amount-input">
            <input
              id="transfer-amount"
              inputMode="decimal"
              autoComplete="off"
              required
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setTransferError("");
              }}
              aria-describedby="available-balance transfer-error"
            />
            <span>kWh</span>
          </div>
          <div className="amount-options">
            {[10, 25, 50, 100].map((value) => (
              <button
                key={value}
                type="button"
                className={amount === String(value) ? "selected" : ""}
                disabled={value > wallet.balance}
                onClick={() => setAmount(String(value))}
              >
                {value} kWh
              </button>
            ))}
          </div>
          <span id="available-balance" className="available-balance">
            Disponibil: <strong>{format(wallet.balance)} kWh</strong>
          </span>
          <p id="transfer-error" role="alert" className="form-error">
            {transferError}
          </p>
          <div className="transfer-summary">
            <span>Sold după transfer</span>
            <strong>
              {format(wallet.balance - (Number(amount.replace(",", ".")) || 0))}{" "}
              kWh
            </strong>
          </div>
          <button
            type="submit"
            className="button forest-button"
            disabled={!ready || wallet.balance <= 0}
          >
            Confirmă transferul demo <Check size={17} />
          </button>
          <span className="transfer-disclaimer">
            <ShieldCheck size={14} /> Simulare locală. Fără transfer real de
            energie.
          </span>
        </form>
      </dialog>
    </main>
  );
}

function HouseCommunity() {
  return (
    <svg
      width="29"
      height="29"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m3 13 11-9 11 9M6 11v13h16V11M11 24v-8h6v8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="m18 4 3-2m2 6 4-1M14 1v-1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
