"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTrailContext } from "./trail-context";

/* ---- Shared context so button (in header) and panel (outside header) share state ---- */

type MenuState = { open: boolean; toggle: () => void; close: () => void };
const MenuCtx = createContext<MenuState>({ open: false, toggle() {}, close() {} });

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  // Close on route change
  useEffect(() => { close(); }, [pathname, close]);

  // Body scroll lock
  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, close]);

  // Swipe (mobile)
  useEffect(() => {
    let sx = 0, sy = 0, on = false;
    function ts(e: TouchEvent) {
      if (window.innerWidth > 639 || e.touches.length !== 1) { on = false; return; }
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; on = true;
    }
    function te(e: TouchEvent) {
      if (!on || e.changedTouches.length !== 1) return;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      on = false;
      if (Math.abs(dy) > Math.abs(dx)) return;
      if (!open && dx < -56 && sx >= window.innerWidth - 40) { setOpen(true); return; }
      if (open && dx > 56) close();
    }
    document.addEventListener("touchstart", ts, { passive: true });
    document.addEventListener("touchend", te, { passive: true });
    return () => { document.removeEventListener("touchstart", ts); document.removeEventListener("touchend", te); };
  }, [open, close]);

  return <MenuCtx.Provider value={{ open, toggle, close }}>{children}</MenuCtx.Provider>;
}

/* ---- Hamburger button (goes inside header) ---- */

export function MenuButton() {
  const { open, toggle } = useContext(MenuCtx);
  return (
    <button
      className="site-menu-button"
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      onClick={toggle}
    >
      <span /><span /><span />
    </button>
  );
}

/* ---- Sidebar panel (goes OUTSIDE header in layout.tsx) ---- */

function titleize(v: string) {
  return v.replace(/^sg-/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildTrail(pathname: string) {
  const s = pathname.split("/").filter(Boolean);
  const t: Array<{ href: string; label: string }> = [{ href: "/", label: "Home" }];
  if (s[0] === "domains") {
    t.push({ href: "/domains", label: "Domains" });
    if (s[1]) t.push({ href: `/domains/${s[1]}`, label: titleize(s[1]) });
    if (s[2] === "topics") {
      t.push({ href: `/domains/${s[1]}/topics`, label: "Topics" });
      if (s[3]) t.push({ href: `/domains/${s[1]}/topics/${s[3]}`, label: titleize(s[3]) });
    }
    if (s[2] === "papers") {
      t.push({ href: `/domains/${s[1]}/papers`, label: "Papers" });
      if (s[3]) t.push({ href: `/domains/${s[1]}/papers/${s[3]}`, label: titleize(s[3]) });
    }
  }
  if (s[0] === "categories" && s[1]) t.push({ href: `/categories/${s[1]}`, label: titleize(s[1]) });
  return t;
}

export function SidebarPanel() {
  const { open, close } = useContext(MenuCtx);
  const pathname = usePathname();
  const { topicTrail } = useTrailContext();
  const ref = useRef<HTMLDivElement>(null);
  const base = buildTrail(pathname);
  const trail = topicTrail.length > 0
    ? [...base.slice(0, base.findIndex((i) => i.label === "Topics") + 1), ...topicTrail]
    : base;

  useEffect(() => { if (open) ref.current?.focus(); }, [open]);

  return (
    <div className="sidebar-root" data-open={open}>
      <div className="sidebar-overlay" onClick={close} />
      <div ref={ref} className="sidebar-panel" tabIndex={-1}>
        <div className="sidebar-header">
          <Link href="/" className="sidebar-logo" onClick={close}>Domain Intel</Link>
          <button className="sidebar-close" onClick={close} aria-label="Close">✕</button>
        </div>
        <nav className="sidebar-body">
          <Link href="/" onClick={close}>Home</Link>
          <Link href="/domains" onClick={close}>All domains</Link>
          {trail.slice(1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "sidebar-active" : ""}
              onClick={close}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
