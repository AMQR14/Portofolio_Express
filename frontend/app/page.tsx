"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Magnetic from "./components/Magnetic";
import { useLenisScroll } from "./components/LenisProvider";
import CertificatePdfPreview from "./components/CertificatePdfPreview";
import TiltCard from "./components/TiltCard";
import HeroAtmosphere from "./components/HeroAtmosphere";
import { Github, Linkedin } from "./components/BrandIcons";
import {
  Globe,
  Star,
  Mail,
  ArrowDown,
  ArrowUpRight,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  Check,
  X,
  ExternalLink,
  Download,
  Clock,
  FileText,
  ShieldCheck,
  Send,
} from "lucide-react";

const API_URL = "/backend";

const getResumeDownloadUrl = (cvUrl: string) => {
  try {
    const url = new URL(cvUrl, "http://placeholder.local");
    // Vercel Blob: ask the CDN to send the file as a download
    if (url.hostname.endsWith("blob.vercel-storage.com")) {
      url.searchParams.set("download", "1");
      return url.toString();
    }
    // Older files saved on the backend's local disk
    if (url.pathname.startsWith("/uploads/")) {
      const filename = url.pathname.split("/").pop();
      if (filename) {
        return `${API_URL}/uploads/download/${encodeURIComponent(filename)}`;
      }
    }
  } catch {
    return cvUrl;
  }
  return cvUrl;
};

interface Project {
  id: number;
  title: string;
  category: string;
  description: string;
  image: string;
  created_at: string;
}

interface Skill {
  id: number;
  name: string;
  level: number;
  category: string;
}

interface Certificate {
  id: number;
  title: string;
  issuer: string;
  issued_date: string;
  credential_url: string;
  image: string;
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar: string;
  rating: number;
}

interface Profile {
  name: string;
  title: string;
  bio: string;
  cv_url: string;
  github_url: string;
  linkedin_url: string;
  email: string;
  avatar: string;
}

export default function Home() {
  const lenisScrollTo = useLenisScroll();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  // Live local time
  const [localTime, setLocalTime] = useState("");

  // Contact form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [alert, setAlert] = useState<{ type: string; text: string } | null>(
    null,
  );

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Live clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLocalTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        }),
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data from backend
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes, projectsRes, skillsRes, certsRes, testimonialsRes] =
          await Promise.allSettled([
            fetch(`${API_URL}/profile`).then((r) => r.json()),
            fetch(`${API_URL}/projects`).then((r) => r.json()),
            fetch(`${API_URL}/skills`).then((r) => r.json()),
            fetch(`${API_URL}/certificates`).then((r) => r.json()),
            fetch(`${API_URL}/testimonials`).then((r) => r.json()),
          ]);

        if (profileRes.status === "fulfilled" && profileRes.value?.success)
          setProfile(profileRes.value.data);
        if (projectsRes.status === "fulfilled" && projectsRes.value?.success)
          setProjects(projectsRes.value.data);
        if (skillsRes.status === "fulfilled" && skillsRes.value?.success)
          setSkills(skillsRes.value.data);
        if (certsRes.status === "fulfilled" && certsRes.value?.success)
          setCertificates(certsRes.value.data);
        if (
          testimonialsRes.status === "fulfilled" &&
          testimonialsRes.value?.success
        )
          setTestimonials(testimonialsRes.value.data);
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setAlert(null);
    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setAlert({
          type: "success",
          text: "Message sent! I'll get in touch with you shortly.",
        });
        setFormData({ name: "", email: "", message: "" });
      } else {
        setAlert({
          type: "error",
          text: data.message || "Failed to send message.",
        });
      }
    } catch {
      setAlert({ type: "error", text: "Could not connect to server." });
    } finally {
      setSending(false);
    }
  };

  const formatYear = (d: string) => {
    if (!d) return "2025";
    return new Date(d).getFullYear();
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      lenisScrollTo(el);
    }
  };

  const renderStars = (rating: number) =>
    [1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={16}
        fill={i <= rating ? "var(--ctp-peach)" : "var(--ctp-surface1)"}
        stroke="none"
        aria-hidden="true"
      />
    ));

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const developerName = profile?.name || "Dennis Snellenberg";
  const contactEmail = profile?.email?.trim();
  const emailComposeUrl = contactEmail
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contactEmail)}&su=${encodeURIComponent("Portfolio inquiry")}`
    : "";
  const resumeDownloadUrl = profile?.cv_url
    ? getResumeDownloadUrl(profile.cv_url)
    : "";

  const normalizeCategory = (category: string | null | undefined) =>
    category?.toLowerCase().replace(/[\s_-]/g, "") ?? "";
  const frontendSkills = skills.filter((skill) => {
    const category = normalizeCategory(skill.category);
    return category.includes("front") || category.includes("ui") || !category;
  });
  const backendSkills = skills.filter((skill) => {
    const category = normalizeCategory(skill.category);
    return (
      category.includes("back") ||
      category.includes("api") ||
      category.includes("server")
    );
  });
  const fullstackSkills = skills.filter((skill) => {
    const category = normalizeCategory(skill.category);
    return (
      category.includes("fullstack") ||
      category.includes("tool") ||
      category.includes("data") ||
      category.includes("devops")
    );
  });

  return (
    <div>
      {/* =========================================================
          1. HERO SECTION (DENNIS SNELLENBERG SIGNATURE HERO)
          ========================================================= */}
      <section className="ds-hero">
            <HeroAtmosphere />
            <div className="ds-hero-top">
          {/* Availability badge */}
          <div className="ds-availability">
            <span className="ds-status-dot" />
            <span>Available for freelance work</span>
          </div>

          {/* Location with wireframe spinning globe */}
          <div className="ds-location-tag">
            <Globe className="ds-globe-icon" size={16} strokeWidth={1.5} />
            <span>Located in Indonesia · Working Globally</span>
          </div>
        </div>

        {/* Monumental Hero Headline */}
        <div className="ds-hero-title-box">
          <h1 className="ds-hero-title">
            Freelance <br />
            <span className="ds-hero-title-outline">Designer &amp;</span> <br />
            <span className="dim">Developer</span>
          </h1>
        </div>

        {/* Hero bottom bar */}
        <div className="ds-hero-bottom-bar">
          <p className="ds-hero-desc">
            {profile?.bio
              ? profile.bio.split("\n")[0]
              : "Helping brands, businesses, and creators thrive in the digital world with obsessive attention to design, typography, and clean code."}
          </p>

          {/* Dennis Snellenberg Magnetic Circle Button */}
          <Magnetic strength={0.4} textStrength={0.65}>
            <button
              onClick={() => scrollToSection("work")}
              className="ds-circle-btn"
              aria-label="Explore Selected Work"
            >
              <span>Explore</span>
              <span>Work</span>
              <span className="ds-circle-btn-arrow"><ChevronDown size={20} /></span>
            </button>
          </Magnetic>
        </div>
      </section>

      {/* =========================================================
          2. INFINITE SMOOTH MARQUEE TICKER (SIGNATURE SNELLENBERG)
          ========================================================= */}
      <div className="ds-marquee-container" aria-hidden="true">
        <div className="ds-marquee-track">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="ds-marquee-item">
              <span>{developerName.toUpperCase()}</span>
              <span className="sep" />
              <span>FREELANCE DESIGNER &amp; DEVELOPER</span>
              <span className="sep" />
              <span>CREATIVE CODER</span>
              <span className="sep" />
              <span>DIGITAL CRAFTSMAN</span>
              <span className="sep" />
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================
          3. ABOUT / STATEMENT SECTION
          ========================================================= */}
      <section id="about" className="ds-section">
        <div className="ds-section-label">01 / Introduction</div>

        <h2 className="ds-statement" data-reveal>
          Helping brands thrive in the digital world. I combine artistic
          sensibility with robust engineering to turn ideas into{" "}
          <span className="ds-text-accent-reveal">
            unforgettable digital experiences
          </span>
          .
        </h2>

        <div className="ds-about-grid" data-reveal>
          <div className="ds-about-text">
            <p>
              The combination of my passion for design, code, and interaction
              positions me in a unique place in the web design world. I bridge
              the gap between creative vision and technical architecture to
              deliver fluid, pixel-perfect solutions.
            </p>
            <p>
              {profile?.bio ||
                "Specializing in modern JavaScript/TypeScript, React, Next.js, and Node.js with Express. I treat every project as an opportunity to push craft, responsiveness, and performance to their highest standards."}
            </p>
          </div>

          <div className="ds-about-action">
            {/* Quick stats strip */}
            <div className="ds-stats-strip">
              <div>
                <div className="ds-stat-value">{projects.length}+</div>
                <div className="ds-stat-label">Projects Built</div>
              </div>
              <div>
                <div className="ds-stat-value">{skills.length}+</div>
                <div className="ds-stat-label">Technologies</div>
              </div>
              <div>
                <div className="ds-stat-value">{certificates.length}+</div>
                <div className="ds-stat-label">Certifications</div>
              </div>
            </div>

            {/* Magnetic pill action buttons */}
            <div
              style={{
                display: "flex",
                gap: "1.5rem",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Magnetic strength={0.3} textStrength={0.5}>
                {resumeDownloadUrl ? (
                  <a
                    href={resumeDownloadUrl}
                    download="resume.pdf"
                    className="ds-pill-btn"
                  >
                    <span>Download Resume</span>
                    <Download size={16} aria-hidden="true" />
                  </a>
                ) : (
                  <button
                    type="button"
                    className="ds-pill-btn"
                    disabled
                    title="Upload a resume in Admin > Profile to enable downloads."
                  >
                    <span>Resume not uploaded</span>
                  </button>
                )}
              </Magnetic>

              <Magnetic strength={0.3} textStrength={0.5}>
                <button
                  onClick={() => scrollToSection("contact")}
                  className="ds-pill-btn"
                  style={{
                    background: "var(--ds-blue)",
                    borderColor: "var(--ds-blue)",
                    color: "#fff",
                  }}
                >
                  <span>Let&apos;s Talk</span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </button>
              </Magnetic>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          4. SELECTED WORK (FEATURED PROJECT SHOWCASE)
          ========================================================= */}
      <section id="work" className="ds-section">
        <div className="ds-section-label">02 / Selected Work</div>

        <div className="ds-work-header" data-reveal>
          <h2 className="ds-work-title">
            Recent <span className="ds-text-accent-reveal">Work</span>
          </h2>
          <span style={{ color: "var(--ds-text-muted)", fontSize: "0.95rem" }}>
            ({projects.length} Projects)
          </span>
        </div>

        {loading ? (
          <div className="ds-loading">
            <div className="loading-spinner" />
            <p>Loading curated work…</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="ds-empty-box">
            No projects available yet. Create your first project in Admin.
          </div>
        ) : (
          <div className="ds-featured-projects">
            {projects.slice(0, 3).map((project, idx) => (
              <Link
                href={`/projects/${project.id}`}
                key={project.id}
                className={`ds-featured-project ${idx % 2 === 1 ? "reverse" : ""}`}
                data-reveal
              >
                <div className="ds-featured-media">
                  <div className="ds-project-window-bar" aria-hidden="true">
                    <span className="ds-project-window-dots">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span>
                      {(project.category || "Selected work").toUpperCase()}
                    </span>
                    <span className="ds-project-window-mark"><ArrowUpRight size={14} /></span>
                  </div>

                  {project.image && (
                    <img
                      src={project.image}
                      alt={project.title}
                      className="ds-featured-image"
                      loading={idx === 0 ? "eager" : "lazy"}
                    />
                  )}
                  {!project.image && (
                    <div className="ds-featured-image-fallback">
                      <span>{project.title}</span>
                    </div>
                  )}
                  <span className="ds-featured-index">
                    {(idx + 1).toString().padStart(2, "0")}{" "}
                    <span>/</span>{" "}
                    {Math.min(projects.length, 3).toString().padStart(2, "0")}
                  </span>
                </div>

                <div className="ds-featured-copy">
                  <span className="ds-featured-kicker">
                    Featured project / {(idx + 1).toString().padStart(2, "0")}
                  </span>
                  <h3 className="ds-featured-title">{project.title}</h3>
                  <p className="ds-featured-description">
                    {project.description ||
                      "A considered digital experience, designed and built with attention to detail."}
                  </p>
                  <div className="ds-featured-meta">
                    <span>{project.category || "Design & Development"}</span>
                    {project.created_at && (
                      <span>{formatYear(project.created_at)}</span>
                    )}
                  </div>
                  <span className="ds-featured-link">
                    Explore case study <ExternalLink size={14} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* More Work Center Button with Magnetic hover */}
        <div className="ds-more-work-box">
          <Magnetic strength={0.3} textStrength={0.5}>
            <Link href="/projects" className="ds-pill-btn">
              <span>Archive / All Work ({projects.length})</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </Magnetic>
        </div>
      </section>

      {/* =========================================================
          5. EXPERTISE & SERVICES (EDITORIAL NUMBERED COLUMNS)
          ========================================================= */}
      <section id="services" className="ds-section">
        <div className="ds-section-label">03 / Expertise &amp; Services</div>

        <h2 className="ds-statement" style={{ marginBottom: "2rem" }} data-reveal>
          I help companies design and engineer{" "}
          <span className="ds-text-accent-reveal">
            world-class digital products
          </span>{" "}
          from scratch to launch.
        </h2>

        <div className="ds-services-grid">
          {/* Column 1 */}
          <div className="ds-service-col" data-reveal>
            <div className="ds-service-num">01 / FRONTEND</div>
            <h3 className="ds-service-title">
              Interface Design &amp; Architecture
            </h3>
            <p className="ds-service-desc">
              Crafting performant, accessible web interfaces utilizing Next.js,
              React, and modern CSS with smooth micro-interactions and tactile
              responsiveness.
            </p>
            <div className="ds-skill-pills">
              {(frontendSkills.length > 0
                ? frontendSkills
                : [
                    { id: 1, name: "React", level: 95 },
                    { id: 2, name: "Next.js", level: 90 },
                    { id: 3, name: "TypeScript", level: 88 },
                    { id: 4, name: "Modern CSS", level: 95 },
                  ]
              ).map((skill) => (
                <div key={skill.id} className="ds-skill-pill">
                  <span>{skill.name}</span>
                  <span className="ds-skill-level">{skill.level}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2 */}
          <div className="ds-service-col" data-reveal>
            <div className="ds-service-num">02 / BACKEND</div>
            <h3 className="ds-service-title">
              APIs &amp; Database Engineering
            </h3>
            <p className="ds-service-desc">
              Building scalable, modular RESTful services with Node.js, Express,
              and relational databases with robust validation and security.
            </p>
            <div className="ds-skill-pills">
              {(backendSkills.length > 0
                ? backendSkills
                : [
                    { id: 5, name: "Node.js", level: 92 },
                    { id: 6, name: "Express.js", level: 90 },
                    { id: 7, name: "REST APIs", level: 94 },
                    { id: 8, name: "MySQL", level: 85 },
                  ]
              ).map((skill) => (
                <div key={skill.id} className="ds-skill-pill">
                  <span>{skill.name}</span>
                  <span className="ds-skill-level">{skill.level}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3 */}
          <div className="ds-service-col" data-reveal>
            <div className="ds-service-num">03 / FULL STACK</div>
            <h3 className="ds-service-title">
              Creative Coding &amp; Interaction
            </h3>
            <p className="ds-service-desc">
              Unifying brand aesthetics with seamless engineering, ensuring
              smooth state management, high SEO rankings, and effortless user
              flow.
            </p>
            <div className="ds-skill-pills">
              {(fullstackSkills.length > 0
                ? fullstackSkills
                : [
                    { id: 9, name: "Git & GitHub", level: 92 },
                    { id: 10, name: "Performance", level: 90 },
                    { id: 11, name: "Responsive UX", level: 96 },
                    { id: 12, name: "System Design", level: 88 },
                  ]
              ).map((skill) => (
                <div key={skill.id} className="ds-skill-pill">
                  <span>{skill.name}</span>
                  <span className="ds-skill-level">{skill.level}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          6. CERTIFICATES & CREDENTIALS
          ========================================================= */}
      {certificates.length > 0 && (
        <section id="certificates" className="ds-section">
          <div className="ds-section-label">04 / Certifications</div>

          <div className="ds-work-header" data-reveal>
            <h2 className="ds-work-title">
              <span className="ds-text-accent-reveal">Verified</span>{" "}
              Credentials
            </h2>
            <span
              style={{ color: "var(--ds-text-muted)", fontSize: "0.95rem" }}
            >
              ({certificates.length} Certifications)
            </span>
          </div>

          <div className="ds-cards-grid">
            {certificates.map((cert) => {
              const year = cert.issued_date
                ? formatYear(cert.issued_date)
                : "Recent";
              const isPdf = /\.pdf(?:$|[?#])/i.test(cert.image || "");

              return (
                <TiltCard
                  as="article"
                  key={cert.id}
                  className="ds-cert-card"
                  data-reveal
                  tabIndex={0}
                  aria-label={`${cert.title}, issued by ${cert.issuer}, ${year}`}
                >
                  {cert.image ? (
                    isPdf ? (
                      <CertificatePdfPreview src={cert.image} />
                    ) : (
                      <img
                        src={cert.image}
                        alt=""
                        className="ds-cert-image"
                        loading="lazy"
                      />
                    )
                  ) : (
                    <div className="ds-cert-image ds-cert-image-placeholder">
                      <FileText
                        size={48}
                        aria-hidden="true"
                        className="ds-cert-placeholder-icon"
                        strokeWidth={1}
                      />
                      <span>Certificate</span>
                    </div>
                  )}

                  <div className="ds-cert-overlay">
                    <div className="ds-cert-card-meta">
                      <span>{year}</span>
                      <span className="ds-cert-card-mark">Verified</span>
                    </div>
                    <div className="ds-cert-card-details">
                      <h3 className="ds-cert-title">{cert.title}</h3>
                      <p className="ds-cert-issuer">
                        Issued by {cert.issuer}
                      </p>
                      {isPdf && (
                        <a
                          href={cert.image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ds-cert-link"
                        >
                          <span>View Certificate PDF</span>
                          <ExternalLink size={14} aria-hidden="true" />
                        </a>
                      )}
                      {cert.credential_url && (
                        <a
                          href={cert.credential_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ds-cert-link"
                        >
                          <span>Verify Credential</span>
                          <ShieldCheck size={14} aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        </section>
      )}

      {/* =========================================================
          7. TESTIMONIALS SECTION
          ========================================================= */}
      {testimonials.length > 0 && (
        <section id="testimonials" className="ds-section">
          <div className="ds-section-label">05 / Testimonials</div>

          <div className="ds-work-header" data-reveal>
            <h2 className="ds-work-title">
              Client <span className="ds-text-accent-reveal">Feedback</span>
            </h2>
          </div>

          <div className="ds-cards-grid">
            {testimonials.map((t) => (
              <TiltCard key={t.id} className="ds-card" data-reveal>
                <div>
                  <div className="ds-testimonial-stars">
                    {renderStars(t.rating)}
                  </div>
                  <p className="ds-testimonial-quote">
                    &ldquo;{t.content}&rdquo;
                  </p>
                </div>

                <div className="ds-testimonial-author">
                  <div className="ds-testimonial-avatar">
                    {t.avatar ? (
                      <img src={t.avatar} alt={t.name} />
                    ) : (
                      getInitials(t.name)
                    )}
                  </div>
                  <div>
                    <div className="ds-testimonial-name">{t.name}</div>
                    <div className="ds-testimonial-role">
                      {t.role}
                      {t.company ? ` · ${t.company}` : ""}
                    </div>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================
          8. DENNIS SNELLENBERG SIGNATURE FOOTER ("LET'S WORK TOGETHER")
          ========================================================= */}
      <footer id="contact" className="ds-cta-section">
        {/* Curved SVG Divider for organic section transition */}
        <div className="ds-curved-divider-wrapper">
          <svg
            className="ds-curved-divider"
            viewBox="0 0 1440 80"
            preserveAspectRatio="none"
          >
            <path
              d="M0,80 C480,0 960,0 1440,80 L1440,80 L0,80 Z"
              fill="var(--ctp-mantle)"
            />
          </svg>
        </div>

        <div className="ds-cta-container">
          <div className="ds-cta-header">
            <div data-reveal>
              <div className="ds-cta-label">Have an idea or project?</div>
              <h2 className="ds-cta-heading">
                Let&apos;s work <br />
                <span className="ds-text-accent-reveal">together</span>
              </h2>
            </div>

            {/* Dennis Snellenberg Monumental Magnetic Circle Button */}
            <Magnetic strength={0.4} textStrength={0.7}>
              <a
                href="#contact-form"
                className="ds-cta-circle-btn"
                aria-label="Go to the contact form"
              >
                <span>Get in</span>
                <span>touch</span>
                <span className="ds-cta-circle-btn-arrow">
                  <ArrowUpRight size={20} aria-hidden="true" />
                </span>
              </a>
            </Magnetic>
          </div>

          <div className="ds-cta-content-grid">
            {/* Left: Contact Info & Direct Pills */}
            <div className="ds-contact-details">
              <h3>Direct Contacts</h3>
              <p>
                Whether you have an upcoming project, a question regarding my
                tech stack, or simply want to say hello, feel free to reach out.
                I reply promptly.
              </p>

              <div className="ds-contact-buttons-row">
                {contactEmail && (
                  <Magnetic strength={0.25} textStrength={0.4}>
                    <a
                      href={emailComposeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ds-contact-pill"
                    >
                      <Mail size={15} />
                      <span>{contactEmail}</span>
                    </a>
                  </Magnetic>
                )}

                {profile?.github_url && (
                  <Magnetic strength={0.25} textStrength={0.4}>
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ds-contact-pill"
                    >
                      <Github size={15} />
                      <span>GitHub</span>
                    </a>
                  </Magnetic>
                )}

                {profile?.linkedin_url && (
                  <Magnetic strength={0.25} textStrength={0.4}>
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ds-contact-pill"
                    >
                      <Linkedin size={15} />
                      <span>LinkedIn</span>
                    </a>
                  </Magnetic>
                )}

                {resumeDownloadUrl && (
                  <Magnetic strength={0.25} textStrength={0.4}>
                    <a
                      href={resumeDownloadUrl}
                      download="resume.pdf"
                      className="ds-contact-pill"
                    >
                      <Download size={15} />
                      <span>Download CV</span>
                    </a>
                  </Magnetic>
                )}
              </div>
            </div>

            {/* Right: Dennis Snellenberg Editorial Underline Form */}
            <div>
              {alert && (
                <div
                  className={`alert alert-${alert.type}`}
                  style={{ marginBottom: "1.5rem" }}
                >
                  {alert.type === "success" ? (
                    <Check size={18} strokeWidth={2.5} />
                  ) : (
                    <X size={18} strokeWidth={2.5} />
                  )}{" "}
                  {alert.text}
                </div>
              )}

              <form
                id="contact-form"
                className="ds-contact-form"
                onSubmit={handleSubmit}
              >
                <div className="ds-form-field">
                  <label htmlFor="name" className="ds-form-label">
                    01 / What&apos;s your name?
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe *"
                    className="ds-form-input"
                    required
                  />
                </div>

                <div className="ds-form-field">
                  <label htmlFor="email" className="ds-form-label">
                    02 / What&apos;s your email?
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com *"
                    className="ds-form-input"
                    required
                  />
                </div>

                <div className="ds-form-field">
                  <label htmlFor="message" className="ds-form-label">
                    03 / Your message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell me about your project, timeline, or idea... *"
                    className="ds-form-textarea"
                    required
                  />
                </div>

                <Magnetic strength={0.3} textStrength={0.5}>
                  <button
                    type="submit"
                    className="ds-form-submit"
                    disabled={
                      sending ||
                      !formData.name ||
                      !formData.message ||
                      !formData.email ||
                      !emailRegex.test(formData.email)
                    }
                  >
                    {sending ? (
                      <span>Sending message…</span>
                    ) : (
                      <>
                        <span>Send message</span>
                        <Send size={16} aria-hidden="true" />
                      </>
                    )}
                  </button>
                </Magnetic>
              </form>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="ds-bottom-bar">
            <div>
              <span>
                © {new Date().getFullYear()} {developerName}. All rights
                reserved.
              </span>
            </div>

            <div className="ds-local-time">
              <Clock size={13} style={{ opacity: 0.7 }} />
              <span>LOCAL TIME {localTime || "GMT+8"}</span>
            </div>

            <div>
              <button
                onClick={() => lenisScrollTo(0)}
                className="ds-back-to-top"
              >
                <span>Back to top</span>
                <ArrowUp size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
