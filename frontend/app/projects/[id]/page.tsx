"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Magnetic from "../../components/Magnetic";
import { Home, ArrowLeft, ArrowRight, ArrowUpRight, ExternalLink } from "lucide-react";

interface Project {
  id: number;
  title: string;
  category: string | null;
  description: string | null;
  image: string | null;
  created_at: string | null;
  gallery?: string[];
  challenge?: string | null;
  approach?: string | null;
  outcome?: string | null;
}

interface ProjectListResponse {
  success: boolean;
  message?: string;
  data: Project[];
}

const API_URL = "/backend";

function isProject(value: unknown): value is Project {
  if (typeof value !== "object" || value === null) return false;
  if (
    !("id" in value) ||
    !("title" in value) ||
    !("category" in value) ||
    !("description" in value) ||
    !("image" in value) ||
    !("created_at" in value)
  ) {
    return false;
  }

  return (
    typeof value.id === "number" &&
    typeof value.title === "string" &&
    (typeof value.category === "string" || value.category === null) &&
    (typeof value.description === "string" || value.description === null) &&
    (typeof value.image === "string" || value.image === null) &&
    (typeof value.created_at === "string" || value.created_at === null)
  );
}

function isProjectArray(value: unknown): value is Project[] {
  return Array.isArray(value) && value.every(isProject);
}

function isProjectDetailResponse(
  value: unknown,
): value is { success: true; data: Project } {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    value.success === true &&
    "data" in value &&
    isProject(value.data)
  );
}

function isProjectListResponse(value: unknown): value is ProjectListResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    value.success === true &&
    "data" in value &&
    isProjectArray(value.data)
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (!projectId) return;
    const controller = new AbortController();

    const fetchProjects = async () => {
      try {
        const [listResponse, detailResponse] = await Promise.all([
          fetch(`${API_URL}/projects`, { signal: controller.signal }),
          fetch(`${API_URL}/projects/${projectId}`, {
            signal: controller.signal,
          }),
        ]);
        const [listPayload, detailPayload]: [unknown, unknown] =
          await Promise.all([listResponse.json(), detailResponse.json()]);

        if (!listResponse.ok || !isProjectListResponse(listPayload)) {
          const message =
            typeof listPayload === "object" &&
            listPayload !== null &&
            "message" in listPayload &&
            typeof listPayload.message === "string"
              ? listPayload.message
              : "Could not load project case study.";
          throw new Error(message);
        }

        if (
          !detailResponse.ok ||
          !isProjectDetailResponse(detailPayload)
        ) {
          const message =
            typeof detailPayload === "object" &&
            detailPayload !== null &&
            "message" in detailPayload &&
            typeof detailPayload.message === "string"
              ? detailPayload.message
              : "Could not load project case study.";
          throw new Error(message);
        }

        const availableProjects = listPayload.data;
        if (!availableProjects.some((item) => item.id === Number(projectId))) {
          throw new Error("Project not found.");
        }
        setProjects(
          availableProjects.map((item) =>
            item.id === detailPayload.data.id ? detailPayload.data : item,
          ),
        );
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Could not connect to server.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchProjects();
    return () => controller.abort();
  }, [projectId]);

  const formatDate = (date: string | null) => {
    if (!date) return "";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "";
    return parsedDate.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const projectIndex = projects.findIndex(
    (item) => item.id === Number(projectId),
  );
  const project = projectIndex >= 0 ? projects[projectIndex] : null;
  const previousProject =
    projectIndex >= 0 ? projects[projectIndex + 1] : undefined;
  const nextProject = projectIndex > 0 ? projects[projectIndex - 1] : undefined;
  const projectYear = project?.created_at
    ? new Date(project.created_at).getFullYear()
    : null;
  const projectDate = project ? formatDate(project.created_at) : "";
  const storySections = project
    ? [
        ["Challenge", project.challenge],
        ["Approach", project.approach],
        ["Outcome", project.outcome],
      ].filter((section): section is [string, string] => Boolean(section[1]))
    : [];

  if (loading) {
    return (
      <div className="ds-detail-page" aria-busy="true">
        <div className="ds-detail-back-links">
          <Link href="/projects" className="ds-archive-back">
            <ArrowLeft size={14} aria-hidden="true" />
            <span>All projects</span>
          </Link>
          <Link href="/" className="ds-detail-home-btn">
            <Home
              aria-hidden="true"
              size={18}
              strokeWidth={1.7}
            />
            <span>Back to Home</span>
          </Link>
        </div>
        <div className="ds-detail-loading" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="ds-visually-hidden">Loading project case study…</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="ds-detail-page">
        <div className="ds-detail-back-links">
          <Link href="/projects" className="ds-archive-back">
            <ArrowLeft size={14} aria-hidden="true" />
            <span>All projects</span>
          </Link>
          <Link href="/" className="ds-detail-home-btn">
            <Home
              aria-hidden="true"
              size={18}
              strokeWidth={1.7}
            />
            <span>Back to Home</span>
          </Link>
        </div>
        <div className="ds-detail-error" role="alert">
          <span className="ds-detail-error-mark" aria-hidden="true">
            !
          </span>
          <div>
            <h1>Project unavailable</h1>
            <p>{error || "This project could not be found."}</p>
            <Link href="/projects" style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", marginTop: "0.75rem" }}>
              <span>Browse all projects</span>
              <ExternalLink size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-detail-page">
      <div className="ds-detail-back-links">
        <Link href="/projects" className="ds-archive-back">
          <ArrowLeft size={14} aria-hidden="true" />
          <span>All projects</span>
        </Link>
        <Link href="/" className="ds-detail-home-btn">
          <Home
            aria-hidden="true"
            size={18}
            strokeWidth={1.7}
          />
          <span>Back to Home</span>
        </Link>
      </div>

      <article className="ds-detail-article">
        <header className="ds-detail-header" data-reveal>
          <div className="ds-detail-meta-bar">
            <span className="ds-detail-cat">
              {project.category || "Selected work"}
            </span>
            <span className="ds-detail-date">
              {projectYear || "Project"}
              {projectDate && (
                <>
                  <span aria-hidden="true">·</span>
                  {projectDate}
                </>
              )}
            </span>
          </div>

          <h1 className="ds-detail-title">{project.title}</h1>
        </header>

        <figure className="ds-detail-image-box" data-reveal>
          <div className="ds-detail-browser-bar" aria-hidden="true">
            <span className="ds-detail-browser-dots">
              <i />
              <i />
              <i />
            </span>
            <span className="ds-detail-browser-address">
              {project.title} / Preview
            </span>
            <span className="ds-detail-browser-menu">···</span>
          </div>
          <div className="ds-detail-screen">
            {project.image ? (
              <img
                src={project.image}
                alt={`${project.title} project preview`}
                className="ds-detail-image"
                fetchPriority="high"
              />
            ) : (
              <div className="ds-detail-image-fallback" aria-hidden="true">
                <span>{project.title}</span>
              </div>
            )}
          </div>
          <figcaption className="ds-detail-image-caption">
            <span>{project.category || "Selected work"}</span>
            <span>Project {(projectIndex + 1).toString().padStart(2, "0")}</span>
          </figcaption>
        </figure>

        <section className="ds-detail-content">
          <div className="ds-detail-overview" data-reveal>
            <span className="ds-detail-section-label">The project</span>
            <h2>Overview</h2>
            <div className="ds-detail-desc">{project.description}</div>
            {storySections.length > 0 && (
              <div className="ds-detail-story">
                {storySections.map(([label, content], index) => (
                  <section className="ds-detail-story-section" key={label}>
                    <span className="ds-detail-story-index">
                      0{index + 1} / {label}
                    </span>
                    <p>{content}</p>
                  </section>
                ))}
              </div>
            )}
          </div>

          <aside className="ds-detail-sidebar" data-reveal>
            <span className="ds-detail-section-label">At a glance</span>
            <dl className="ds-detail-facts">
              <div>
                <dt>Category</dt>
                <dd>{project.category || "Uncategorized"}</dd>
              </div>
              {projectYear && !Number.isNaN(projectYear) && (
                <div>
                  <dt>Year</dt>
                  <dd>{projectYear}</dd>
                </div>
              )}
              {projectDate && (
                <div>
                  <dt>Published</dt>
                  <dd>{projectDate}</dd>
                </div>
              )}
            </dl>
            <Magnetic strength={0.3} textStrength={0.5}>
              <Link href="/#contact" className="ds-detail-contact ds-pill-btn">
                <span>Start a project</span>
                <ArrowUpRight size={18} strokeWidth={2.2} aria-hidden="true" />
              </Link>
            </Magnetic>
          </aside>
        </section>

        {project.gallery && project.gallery.length > 0 && (
          <section className="ds-detail-gallery" aria-labelledby="detail-gallery-title">
            <div className="ds-detail-gallery-heading" data-reveal>
              <div>
                <span className="ds-detail-section-label">
                  More from the project
                </span>
                <h2 id="detail-gallery-title">In detail</h2>
              </div>
              <span className="ds-detail-gallery-count">
                {project.gallery.length.toString().padStart(2, "0")} views
              </span>
            </div>
            <div className="ds-detail-gallery-grid">
              {project.gallery.map((image, index) => (
                <figure
                  className="ds-detail-gallery-item"
                  key={`${image}-${index}`}
                  data-reveal
                >
                  <div className="ds-detail-gallery-image-wrap">
                    <img
                      src={image}
                      alt={`${project.title} detail screenshot ${index + 1}`}
                      loading="lazy"
                    />
                  </div>
                  <figcaption>
                    <span>Detail view</span>
                    <span>{(index + 1).toString().padStart(2, "0")}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        <nav className="ds-detail-project-nav" aria-label="Browse projects" data-reveal>
          {previousProject ? (
            <Link
              href={`/projects/${previousProject.id}`}
              className="ds-detail-nav-card previous"
              rel="prev"
            >
              <span className="ds-detail-nav-label">
                <ArrowLeft size={14} aria-hidden="true" />
                <span>Previous project</span>
              </span>
              <span className="ds-detail-nav-title">{previousProject.title}</span>
              <span className="ds-detail-nav-category">
                {previousProject.category || "Selected work"}
              </span>
            </Link>
          ) : (
            <span className="ds-detail-nav-empty" aria-hidden="true" />
          )}

          {nextProject ? (
            <Link
              href={`/projects/${nextProject.id}`}
              className="ds-detail-nav-card next"
              rel="next"
            >
              <span className="ds-detail-nav-label">
                <span>Next project</span>
                <ArrowRight size={14} aria-hidden="true" />
              </span>
              <span className="ds-detail-nav-title">{nextProject.title}</span>
              <span className="ds-detail-nav-category">
                {nextProject.category || "Selected work"}
              </span>
            </Link>
          ) : (
            <span className="ds-detail-nav-empty" aria-hidden="true" />
          )}
        </nav>
      </article>
    </div>
  );
}
