"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/runs", label: "Runs" },
  { href: "/checks", label: "Checks guide" },
];

export default function NavLinks() {
  const path = usePathname() || "/";
  const active = (h: string) => (h === "/" ? path === "/" || path.startsWith("/url") : path.startsWith(h));
  return (
    <nav aria-label="Main">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={active(l.href) ? "active" : ""} aria-current={active(l.href) ? "page" : undefined}>{l.label}</Link>
      ))}
    </nav>
  );
}
