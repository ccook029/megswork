"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home", emoji: "🏠" },
  { href: "/gradebook", label: "Gradebook", emoji: "📖" },
  { href: "/documents", label: "Documents", emoji: "📁" },
];

const comingSoon = [];

export default function Nav() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <h1 className="brand">
        Meagan&apos;s Teaching Dashboard
        <small>John Paul II CSS</small>
      </h1>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`navlink${pathname === l.href ? " active" : ""}`}
        >
          <span>{l.emoji}</span> {l.label}
        </Link>
      ))}
      {comingSoon.map((l) => (
        <span key={l.label} className="navlink soon">
          <span>{l.emoji}</span> {l.label} <span className="tag">soon</span>
        </span>
      ))}
    </aside>
  );
}
