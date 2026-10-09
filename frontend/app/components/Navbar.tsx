"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Magnetic from "./Magnetic";
import { useLenisScroll } from "./LenisProvider";
import { ArrowUpRight, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const lenisScrollTo = useLenisScroll();
  const isHome = pathname === "/";
  const [profileName, setProfileName] = useState("Dennis");
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/backend/profile");
        const data = await res.json();
        if (data.success && data.data?.name) setProfileName(data.data.name);
      } catch (error) {
        console.error("Unable to load profile name:", error);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    let active = true;
    const checkAdminSession = async () => {
      try {
        const res = await fetch("/backend/auth/session", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (active) setAdminAuthenticated(data.authenticated === true);
      } catch {
        // Keep the current navigation state if the API is temporarily offline.
      }
    };

    const handleAuthChange = (event: Event) => {
      const authenticated = (event as CustomEvent<boolean>).detail;
      setAdminAuthenticated(authenticated);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void checkAdminSession();
    };

    void checkAdminSession();
    window.addEventListener("portfolio-admin-auth-change", handleAuthChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      active = false;
      window.removeEventListener("portfolio-admin-auth-change", handleAuthChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
      progressRef.current?.style.setProperty(
        "transform",
        `scaleX(${Math.min(1, Math.max(0, progress))})`,
      );
      progressRef.current?.parentElement?.setAttribute(
        "aria-valuenow",
        Math.round(progress * 100).toString(),
      );

      if (!isHome) {
        setActiveSection("");
        return;
      }
      const sections = [
        "about",
        "work",
        "services",
        "certificates",
        "testimonials",
        "contact",
      ]
        .map((id) => document.getElementById(id))
        .filter((section): section is HTMLElement => section !== null);
      const passedSections = sections.filter(
        (section) =>
          section.getBoundingClientRect().top <= window.innerHeight * 0.38,
      );
      const currentSection = passedSections.length
        ? passedSections[passedSections.length - 1].id
        : "";
      setActiveSection((current) =>
        current === currentSection ? current : currentSection,
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [isHome]);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    if (!isHome) return;
    const el = document.getElementById(id);
    if (el) {
      lenisScrollTo(el);
    }
  };

  return (
    <>
      <div
        className="ds-scroll-progress"
        role="progressbar"
        aria-label="Page scroll progress"
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div ref={progressRef} />
      </div>
      {/* ── Fixed Top Header ── */}
      <header className={`ds-header ${scrolled ? "scrolled" : ""}`}>
        {/* Left: Signature "© Code by [Name]" */}
        <Magnetic strength={0.2} textStrength={0.35}>
          <Link href="/" className="ds-logo">
            <span className="ds-logo-symbol">©</span>
            <span className="ds-logo-label">Code by</span>
            <span className="ds-logo-author">{profileName}</span>
          </Link>
        </Magnetic>

        {/* Right: Primary Navigation Links */}
        <nav>
          <ul className="ds-nav">
            <li>
              <Magnetic strength={0.25} textStrength={0.4}>
                <Link
                  href={isHome ? "#work" : "/#work"}
                  className={`ds-nav-link ${
                    pathname.startsWith("/projects") ||
                    activeSection === "work"
                      ? "active"
                      : ""
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  Work
                </Link>
              </Magnetic>
            </li>
            <li>
              <Magnetic strength={0.25} textStrength={0.4}>
                {isHome ? (
                  <a
                    href="#about"
                    className={`ds-nav-link ${activeSection === "about" ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollTo("about");
                    }}
                  >
                    About
                  </a>
                ) : (
                  <Link
                    href="/#about"
                    className={`ds-nav-link ${activeSection === "about" ? "active" : ""}`}
                  >
                    About
                  </Link>
                )}
              </Magnetic>
            </li>
            <li>
              <Magnetic strength={0.25} textStrength={0.4}>
                {isHome ? (
                  <a
                    href="#services"
                    className={`ds-nav-link ${activeSection === "services" ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollTo("services");
                    }}
                  >
                    Services
                  </a>
                ) : (
                  <Link
                    href="/#services"
                    className={`ds-nav-link ${activeSection === "services" ? "active" : ""}`}
                  >
                    Services
                  </Link>
                )}
              </Magnetic>
            </li>
            <li>
              <Magnetic strength={0.25} textStrength={0.4}>
                {isHome ? (
                  <a
                    href="#contact"
                    className={`ds-nav-link ${activeSection === "contact" ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollTo("contact");
                    }}
                  >
                    Contact
                  </a>
                ) : (
                  <Link
                    href="/#contact"
                    className={`ds-nav-link ${activeSection === "contact" ? "active" : ""}`}
                  >
                    Contact
                  </Link>
                )}
              </Magnetic>
            </li>
            {adminAuthenticated && (
              <li>
                <Magnetic strength={0.3} textStrength={0.5}>
                  <Link
                    href="/admin"
                    className={`ds-header-cta ${
                      pathname.startsWith("/admin") ? "active" : ""
                    }`}
                  >
                    <span>Admin</span>
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </Link>
                </Magnetic>
              </li>
            )}
          </ul>
        </nav>
      </header>

      {/* ── Dennis Snellenberg Floating Magnetic Menu Button (On Scroll) ── */}
      <div className={`ds-floating-menu-trigger ${scrolled ? "visible" : ""}`}>
        <Magnetic strength={0.4} textStrength={0.6}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="ds-floating-btn-round"
            aria-label="Toggle navigation drawer"
            aria-expanded={menuOpen}
            aria-controls="site-navigation-drawer"
          >
            <div className={`ds-hamburger-icon ${menuOpen ? "open" : ""}`}>
              <span className="line-1" />
              <span className="line-2" />
            </div>
          </button>
        </Magnetic>
      </div>

      {/* ── Dennis Snellenberg Full-Screen Slide-in Navigation Drawer ── */}
      <div
        id="site-navigation-drawer"
        className={`ds-nav-drawer ${menuOpen ? "open" : ""}`}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div
          className="ds-drawer-backdrop"
          onClick={() => setMenuOpen(false)}
        />
        <div className="ds-drawer-content">
          <div className="ds-drawer-inner">
            <div className="ds-drawer-label">Navigation</div>
            <ul className="ds-drawer-links">
              <li>
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="ds-drawer-link"
                >
                  <span>01</span>
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link
                  href={isHome ? "#work" : "/#work"}
                  onClick={() => setMenuOpen(false)}
                  className={`ds-drawer-link ${
                    pathname.startsWith("/projects") ||
                    activeSection === "work"
                      ? "active"
                      : ""
                  }`}
                >
                  <span>02</span>
                  <span>Work</span>
                </Link>
              </li>
              <li>
                {isHome ? (
                  <a
                    href="#about"
                    onClick={() => scrollTo("about")}
                    className={`ds-drawer-link ${activeSection === "about" ? "active" : ""}`}
                  >
                    <span>03</span>
                    <span>About</span>
                  </a>
                ) : (
                  <Link
                    href="/#about"
                    onClick={() => setMenuOpen(false)}
                    className={`ds-drawer-link ${activeSection === "about" ? "active" : ""}`}
                  >
                    <span>03</span>
                    <span>About</span>
                  </Link>
                )}
              </li>
              <li>
                {isHome ? (
                  <a
                    href="#services"
                    onClick={() => scrollTo("services")}
                    className={`ds-drawer-link ${activeSection === "services" ? "active" : ""}`}
                  >
                    <span>04</span>
                    <span>Services</span>
                  </a>
                ) : (
                  <Link
                    href="/#services"
                    onClick={() => setMenuOpen(false)}
                    className={`ds-drawer-link ${activeSection === "services" ? "active" : ""}`}
                  >
                    <span>04</span>
                    <span>Services</span>
                  </Link>
                )}
              </li>
              <li>
                {isHome ? (
                  <a
                    href="#contact"
                    onClick={() => scrollTo("contact")}
                    className={`ds-drawer-link ${activeSection === "contact" ? "active" : ""}`}
                  >
                    <span>05</span>
                    <span>Contact</span>
                  </a>
                ) : (
                  <Link
                    href="/#contact"
                    onClick={() => setMenuOpen(false)}
                    className={`ds-drawer-link ${activeSection === "contact" ? "active" : ""}`}
                  >
                    <span>05</span>
                    <span>Contact</span>
                  </Link>
                )}
              </li>
              {adminAuthenticated && (
                <li>
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="ds-drawer-link"
                  >
                    <span>06</span>
                    <span>Admin Panel</span>
                  </Link>
                </li>
              )}
            </ul>

            <div className="ds-drawer-footer">
              <div className="ds-drawer-label">Links</div>
              <div className="ds-drawer-socials">
                <Link href="/projects" className="ds-drawer-social-link">
                  Archive
                </Link>
                {adminAuthenticated && (
                  <Link href="/admin" className="ds-drawer-social-link">
                    Admin
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
