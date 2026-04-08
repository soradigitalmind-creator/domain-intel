"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  // When topicTrail is injected by a topic page, replace the auto-generated
  // topic items (after "Topics") with the real parent→child chain.
  const trail = topicTrail.length > 0
    ? [
        ...baseTrail.slice(0, baseTrail.findIndex((item) => item.label === "Topics") + 1),
        ...topicTrail,
      ]
    : baseTrail;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function syncIsMobile() {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    }

    syncIsMobile();
    window.addEventListener("resize", syncIsMobile);
    return () => window.removeEventListener("resize", syncIsMobile);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      panelRef.current?.focus();
      return;
    }

    buttonRef.current?.focus();
  }, [open]);

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

      const startedNearPanelEdge =
        startX >= panelRect.left && startX <= panelRect.left + SWIPE_CLOSE_EDGE;

      if (startedNearPanelEdge) {
        setOpen(false);
      }
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [open]);

  const panel = (
    <>
      {open && (
        <div className="site-menu-overlay" aria-hidden onClick={() => setOpen(false)} />
      )}
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
          <Link href="/" className="site-menu-panel-logo" onClick={() => setOpen(false)}>Domain Intel</Link>
          <button
            className="site-menu-panel-close"
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>
        <div className="site-menu-panel-body">
          <nav className="site-menu-section" aria-label="Main">
            <Link href="/" onClick={() => setOpen(false)}>Home</Link>
            <Link href="/domains" onClick={() => setOpen(false)}>All domains</Link>
            {trail.length > 1 && trail.slice(1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname === item.href ? "site-menu-active" : ""}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );

  return (
    <div className="site-menu" data-open={open} ref={ref}>
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
      {mounted ? (isMobile ? createPortal(panel, document.body) : panel) : null}
    </div>
  );
}
