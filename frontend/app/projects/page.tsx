"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProjectHoverPreview from "../components/ProjectHoverPreview";
import { Search, ArrowLeft, ArrowUpRight, CornerDownLeft } from "lucide-react";

interface Project {
  id: number;
  title: string;
  category: string | null;
  description: string;
  image: string;
  created_at: string;
}

const API_URL = "/backend";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isHoveringProjects, setIsHoveringProjects] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${API_URL}/projects`);
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.data)) {
          throw new Error(data.message || "The project service returned an invalid response.");
        }
        setProjects(data.data);
      } catch (error) {
        console.error("Unable to load project archive:", error);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Could not connect to the project service.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const formatYear = (d: string) => {
    if (!d) return "—";
    return new Date(d).getFullYear();
  };

  const categoryMap = new Map<string, string>();
  projects.forEach((project) => {
    const category = project.category?.trim();
    if (category) {
      const normalizedCategory = category.toLowerCase();
      if (!categoryMap.has(normalizedCategory)) {
        categoryMap.set(normalizedCategory, category);
      }
    }
  });
  const categories = ["All", ...categoryMap.values()];
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filtered = projects.filter((project) => {
    const matchesCategory =
      filter === "All" ||
      project.category?.trim().toLowerCase() === filter.toLowerCase();
    const matchesSearch =
      !normalizedQuery ||
      [project.title, project.category, project.description].some((value) =>
        value?.toLowerCase().includes(normalizedQuery),
      );
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <ProjectHoverPreview
        project={activeProject}
        visible={isHoveringProjects}
      />
      <div className="ds-archive-page">
        <Link href="/" className="ds-archive-back">
          <ArrowLeft size={14} aria-hidden="true" />
          <span>Back to Home</span>
        </Link>

        <div className="ds-archive-header">
          <div className="ds-section-label">Archive</div>
          <h1 className="ds-archive-title">
            Selected Projects <br />
            <span style={{ color: "var(--ds-text-muted)" }}>
              &amp; Experiments
            </span>
          </h1>
        </div>

        <div className="ds-archive-toolbar">
          {categories.length > 1 && (
            <div
              className="ds-archive-filters"
              aria-label="Filter projects by category"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`ds-archive-filter-btn ${filter === cat ? "active" : ""}`}
                  aria-pressed={filter === cat}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
          <label className="ds-archive-search">
            <span className="ds-archive-search-icon" aria-hidden="true">
              <Search size={18} strokeWidth={1.8} />
            </span>
            <span className="ds-visually-hidden">Search projects</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search projects"
            />
            <span className="ds-archive-search-key" aria-hidden="true">
              <CornerDownLeft size={14} />
            </span>
          </label>
        </div>
        {!loading && !loadError && (
          <p className="ds-archive-result-count" aria-live="polite">
            Showing {filtered.length} of {projects.length} projects
          </p>
        )}

        {loading ? (
          <div className="ds-loading">
            <div className="loading-spinner" />
            <p>Loading projects archive…</p>
          </div>
        ) : filtered.length === 0 ? (
          loadError ? (
            <div className="ds-empty-box" role="alert">
              Could not load projects: {loadError}
            </div>
          ) : projects.length === 0 ? (
            <div className="ds-empty-box">No projects have been added yet.</div>
          ) : (
          <div className="ds-empty-box">
            {normalizedQuery
              ? `No projects match “${searchQuery.trim()}”. Try another search.`
              : "No projects found in this category."}
          </div>
          )
        ) : (
          <div
            className="ds-project-list"
            onMouseEnter={() => setIsHoveringProjects(true)}
            onMouseLeave={() => {
              setIsHoveringProjects(false);
              setActiveProject(null);
            }}
          >
            {filtered.map((project, idx) => (
              <Link
                href={`/projects/${project.id}`}
                key={project.id}
                className="ds-project-row"
                onMouseEnter={() => setActiveProject(project)}
                data-reveal
              >
                <div className="ds-project-row-left">
                  <span className="ds-project-num">
                    {(idx + 1).toString().padStart(2, "0")} /
                  </span>
                  <span className="ds-project-name">{project.title}</span>
                </div>

                <div className="ds-project-row-right">
                  <span className="ds-project-cat">
                    {project.category || "Development"}
                  </span>

                  <span
                    style={{
                      fontFamily: "Fira Code, monospace",
                      color: "var(--ds-text-muted)",
                      fontSize: "0.85rem",
                    }}
                  >
                    {formatYear(project.created_at)}
                  </span>

                  {project.image && (
                    <img
                      src={project.image}
                      alt={project.title}
                      className="ds-project-preview-thumb"
                    />
                  )}

                  <span className="ds-project-arrow">
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}