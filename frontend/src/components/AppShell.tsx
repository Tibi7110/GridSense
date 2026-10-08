"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  ChevronDown,
  CircleHelp,
  History,
  House,
  LayoutGrid,
  Leaf,
  Menu,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";

const navigation = [
  { id: "acasa", label: "Privire de ansamblu", icon: LayoutGrid },
  { id: "energie", label: "Scor și consum", icon: Zap },
  { id: "portofel", label: "Portofel prosumator", icon: Wallet },
  { id: "comunitate", label: "Comunitate", icon: Users },
  { id: "activitate", label: "Activitate", icon: History },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [active, setActive] = useState("acasa");
  const [menu, setMenu] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [compact, setCompact] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const sync = () => {
      setCompact(query.matches);
      setMenu(false);
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!compact || !menu) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebarRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        menuButtonRef.current?.focus();
      }
      if (event.key === "Tab") {
        const elements = sidebarRef.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        );
        if (!elements?.length) return;
        const first = elements[0],
          last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [compact, menu]);

  useEffect(() => {
    const update = () => {
      setActive(window.location.hash.slice(1) || "acasa");
      setMenu(false);
    };
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, [pathname]);

  return (
    <div className={`app-shell ${collapsed ? "menu-collapsed" : ""}`}>
      <a className="skip-link" href="#main-content">
        Sari la conținut
      </a>
      {menu && (
        <button
          className="sidebar-scrim"
          aria-label="Închide meniul"
          onClick={() => setMenu(false)}
        />
      )}
      <aside
        id="main-menu"
        ref={sidebarRef}
        inert={compact ? !menu : collapsed}
        className={`sidebar ${menu ? "is-open" : ""}`}
        aria-label="Meniu lateral"
      >
        <div className="sidebar-scroll">
          <Link href="/" className="brand" onClick={() => setMenu(false)}>
            <span className="brand-mark">
              <Zap size={23} fill="currentColor" />
            </span>
            GridSense<span className="brand-dot">.</span>
          </Link>
          <button
            className="mobile-close icon-button"
            aria-label="Închide meniul"
            onClick={() => setMenu(false)}
          >
            <X size={20} />
          </button>
          <div className="workspace-label">SPAȚIUL TĂU VERDE</div>
          <nav aria-label="Navigare principală" className="side-nav">
            {navigation.map(({ id, label, icon: Icon }) => (
              <Link
                key={id}
                href={`/#${id}`}
                onClick={() => {
                  setActive(id);
                  setMenu(false);
                }}
                aria-current={
                  pathname === "/" && active === id ? "location" : undefined
                }
                className={pathname === "/" && active === id ? "active" : ""}
              >
                <Icon size={19} strokeWidth={1.7} />
                <span>{label}</span>
                {id === "comunitate" && <span className="nav-count">24</span>}
              </Link>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="grow-card">
              <span className="grow-icon">
                <Leaf size={23} />
              </span>
              <h3>
                Un mic pas pentru tine.
                <br />
                Un viitor mai verde.
              </h3>
              <p>Descoperă ce poți face cu energia ta.</p>
              <Link href="/abonamente" onClick={() => setMenu(false)}>
                Explorează planurile <ArrowUpRight size={16} />
              </Link>
            </div>
            <Link
              href="/#cum-functioneaza"
              className="help-link"
              onClick={() => setMenu(false)}
            >
              <CircleHelp size={18} /> Cum funcționează
            </Link>
          </div>
        </div>
        <Link
          href="/login"
          className="profile-link"
          onClick={() => setMenu(false)}
        >
          <span className="avatar">TU</span>
          <span>
            <strong>Contul tău</strong>
            <small>Explorează GridSense</small>
          </span>
          <ArrowUpRight size={17} />
        </Link>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <div className="topbar-title">
            <button
              className="mobile-menu icon-button"
              ref={menuButtonRef}
              aria-label={
                compact
                  ? menu
                    ? "Închide meniul"
                    : "Deschide meniul"
                  : collapsed
                    ? "Deschide meniul"
                    : "Restrânge meniul"
              }
              aria-controls="main-menu"
              aria-expanded={compact ? menu : !collapsed}
              onClick={() =>
                compact ? setMenu(!menu) : setCollapsed(!collapsed)
              }
            >
              <Menu size={22} />
            </button>
            <span>
              Mai aproape de un viitor verde <Leaf size={14} />
            </span>
          </div>
          <div className="topbar-actions">
            <Link href="/#comunitate" className="location-chip">
              <House size={15} /> Dealul Soarelui <ChevronDown size={14} />
            </Link>
            <span className="topbar-divider" />
            <div className="notification-wrap">
              <button
                className="icon-button notification-button"
                aria-label="Notificări"
                aria-expanded={notifications}
                onClick={() => setNotifications(!notifications)}
              >
                <Bell size={19} />
                <i />
              </button>
              {notifications && (
                <div className="notification-popover">
                  <strong>Ești la zi 🌱</strong>
                  <p>
                    Aici vor apărea noutățile despre energia și comunitatea ta.
                  </p>
                  <span>Previzualizare demonstrativă</span>
                </div>
              )}
            </div>
            <Link
              href="/login"
              className="avatar small-avatar"
              aria-label="Deschide contul"
            >
              TU
            </Link>
          </div>
        </header>
        <div id="main-content">{children}</div>
        <footer className="app-footer">
          <span>
            <Zap size={13} /> GridSense · Energie bună, împreună.
          </span>
          <span>
            Făcut pentru un mâine mai verde <Leaf size={13} />
          </span>
        </footer>
      </div>
    </div>
  );
}
