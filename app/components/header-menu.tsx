"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const trail = buildTrail(pathname);

  return (
    <details className="site-menu">
      <summary className="site-menu-button" aria-label="Open menu">
        <span />
        <span />
        <span />
      </summary>
      <div className="site-menu-panel">
        <nav className="site-menu-section" aria-label="Main">
          <Link href="/">Home</Link>
          <Link href="/domains">All domains</Link>
        </nav>
        {trail.length > 1 ? (
          <nav className="site-menu-section" aria-label="Current path">
            {trail.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </details>
  );
}
