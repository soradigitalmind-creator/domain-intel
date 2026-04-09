"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTrailContext } from "./trail-context";

type TrailItem = {
  href: string;
  label: string;
};

const MOBILE_BREAKPOINT = 639;
const MENU_ID = "site-menu-panel";
const SWIPE_OPEN_EDGE = 40;
const SWIPE_CLOSE_EDGE = 72;
const SWIPE_DISTANCE = 56;

function titleize(value: string) {
  return value
    .replace(/^sg-/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildTrail(pathname: string): TrailItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const trail: TrailItem[] = [{ href: "/", label: "Home" }];

  if (segments[0] === "domains") {
    trail.push({ href: "/domains", label: "Domains" });

    if (segments[1]) {
      trail.push({ href: `/domains/${segments[1]}`, label: titleize(segments[1]) });
    }

    if (segments[2] === "topics") {
      trail.push({ href: `/domains/${segments[1]}/topics`, label: "Topics" });
      if (segments[3]) {
        trail.push({
          href: `/domains/${segments[1]}/topics/${segments[3]}`,
          label: titleize(segments[3]),
        });
      }
    }

    if (segments[2] === "papers") {
      trail.push({ href: `/domains/${segments[1]}/papers`, label: "Papers" });
      if (segments[3]) {
        trail.push({
          href: `/domains/${segments[1]}/papers/${segments[3]}`,
          label: titleize(segments[3]),
        });
      }
    }
  }

  if (segments[0] === "categories" && segments[1]) {
    trail.push({
      href: `/categories/${segments[1]}`,
      label: titleize(segments[1]),
    });
  }

  return trail;
}

export function HeaderMenu() {
  const pathname = usePathname();
  const { topicTrail } = useTrailContext();
  const baseTrail = buildTrail(pathname);
  const trail = topicTrail.length > 0
    ? [
        ...baseTrail.slice(0, baseTrail.findIndex((item) => item.label === "Topics") + 1),
        ...topicTrail,
      ]
    : baseTrail;
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Close on route change
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  // Focus management
  useEffect(() => {
    if (open) {
      panelRef.current?.focus();
    }
  }, [open]);

  // Swipe gestures (mobile)
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let active = false;

    function onTouchStart(e: TouchEvent) {
      if (window.innerWidth > MOBILE_BREAKPOINT || e.touches.length !== 1) {
        active = false;
        return;
      }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      active = true;
    }

    function onTouchEnd(e: TouchEvent) {
      if (!active || e.changedTouches.length !== 1) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      active = false;
      if (Math.abs(dy) > Math.abs(dx)) return;

      if (!open && dx < -SWIPE_DISTANCE && startX >= window.innerWidth - SWIPE_OPEN_EDGE) {
        setOpen(true);
        return;
      }

      if (!open || dx <= SWIPE_DISTANCE) return;
      const panelRect = panelRef.current?.getBoundingClientRect();
      if (!panelRect) return;
      if (startX >= panelRect.left && startX <= panelRect.left + SWIPE_CLOSE_EDGE) {
        close();
      }
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [open, close]);

  // Navigate and close — used by all panel links
  const handleNav = useCallback(() => {
    close();
  }, [close]);

  return (
    <div className="site-menu" data-open={open}>
      <div
        className="site-menu-overlay"
        data-visible={open}
        onClick={close}
      />
      <button
        ref={buttonRef}
        className="site-menu-button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-controls={MENU_ID}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>
      <div
        id={MENU_ID}
        ref={panelRef}
        className="site-menu-panel"
        aria-hidden={!open}
        aria-modal={open}
        role="dialog"
        tabIndex={-1}
      >
        <div className="site-menu-panel-header">
          <Link href="/" className="site-menu-panel-logo" onClick={handleNav}>Domain Intel</Link>
          <button
            className="site-menu-panel-close"
            type="button"
            aria-label="Close menu"
            onClick={close}
          >
            ✕
          </button>
        </div>
        <div className="site-menu-panel-body">
          <nav className="site-menu-section" aria-label="Main">
            <Link href="/" onClick={handleNav}>Home</Link>
            <Link href="/domains" onClick={handleNav}>All domains</Link>
            {trail.length > 1 && trail.slice(1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname === item.href ? "site-menu-active" : ""}
                onClick={handleNav}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
