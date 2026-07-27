"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="ScopeGuard AI home">
          <span className="brand-mark">S</span><span>ScopeGuard <b>AI</b></span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link className={pathname.startsWith("/projects") ? "active" : ""} href="/projects">Projects</Link>
          <Link className="button button-small button-primary" href="/projects/new">New project <span>+</span></Link>
        </nav>
      </div>
    </header>
  );
}
