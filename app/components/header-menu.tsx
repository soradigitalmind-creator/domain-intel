"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

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
      if (!open && dx < -30 && sx >= window.innerWidth - 80) { setOpen(true); return; }
      if (open && dx > 56) close();
    }
    document.addEventListener("touchstart", ts, { passive: true });
    document.addEventListener("touchend", te, { passive: true });
    return () => { document.removeEventListener("touchstart", ts); document.removeEventListener("touchend", te); };
  }, [open, close]);

  return <MenuCtx.Provider value={{ open, toggle, close }}>{children}</MenuCtx.Provider>;
}

/* ---- Search button (goes inside header, next to hamburger) ---- */

export function SearchButton() {
  const router = useRouter();
  return (
    <button
      className="site-search-button"
      aria-label="Search"
      onClick={() => router.push("/search")}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.6" />
        <line x1="10" y1="10" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </button>
  );
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

type NavCategory = { slug: string; label: string };

export function SidebarPanel({ categories }: { categories: NavCategory[] }) {
  const { open, close } = useContext(MenuCtx);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

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
          <Link href="/" className={pathname === "/" ? "sidebar-active" : ""} onClick={close}>Home</Link>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className={pathname === `/categories/${cat.slug}` ? "sidebar-active" : ""}
              onClick={close}
            >
              {cat.label}
            </Link>
          ))}
          <div className="sidebar-divider" />
          <Link href="/search" className={pathname === "/search" ? "sidebar-active" : ""} onClick={close}>Search</Link>
          <Link href="/domains" className={pathname === "/domains" ? "sidebar-active" : ""} onClick={close}>All domains</Link>
        </nav>
      </div>
    </div>
  );
}
