"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTrailContext } from "./trail-context";

type TrailItem = {
  href: string;
  label: string;
};

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
  const ref = useRef<HTMLDivElement>(null);

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
    let startX = 0;
    let startY = 0;

    function onTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }

    function onTouchEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dy) > Math.abs(dx)) return; // 縦スクロールは無視

      if (!open && dx < -50 && startX > window.innerWidth - 40) {
        setOpen(true); // 右端から左にスワイプ → 開く
      } else if (open && dx > 50) {
        setOpen(false); // 開いている状態で右にスワイプ → 閉じる
      }
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [open]);

  return (
    <div className="site-menu" data-open={open} ref={ref}>
      {open && (
        <div className="site-menu-overlay" aria-hidden onClick={() => setOpen(false)} />
      )}
      <button
        className="site-menu-button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>
      <div className="site-menu-panel" aria-hidden={!open}>
        <nav className="site-menu-section" aria-label="Main">
          <Link href="/">Home</Link>
          <Link href="/domains">All domains</Link>
        </nav>
        {trail.length > 1 ? (
          <nav className="site-menu-section" aria-label="Current path">
            {trail.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname === item.href ? "site-menu-active" : ""}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
