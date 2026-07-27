"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, ShieldCheck } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="ScopeGuard AI home">
          <span className="brand-mark" aria-hidden="true"><ShieldCheck size={19} strokeWidth={2.2} /></span>
          <span className="brand-copy">
            <strong>ScopeGuard <b>AI</b></strong>
            <small>Project control</small>
          </span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link className={`nav-link${pathname.startsWith("/projects") ? " active" : ""}`} href="/projects">Projects</Link>
          <Link className="button button-small button-primary nav-create" href="/projects/new"><Plus size={16} aria-hidden="true" /><span className="nav-new-label">New project</span></Link>
        </nav>
      </div>
    </header>
  );
}
