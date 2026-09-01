"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo">
          MyPortfolio
        </Link>
        <ul className="navbar-links">
          <li>
            <Link
              href="/"
              className={pathname === "/" ? "active" : ""}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/projects"
              className={pathname.startsWith("/projects") ? "active" : ""}
            >
              Projects
            </Link>
          </li>
          <li>
            <Link
              href="/#contact"
              className={pathname === "/#contact" ? "active" : ""}
            >
              Contact
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}