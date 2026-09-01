"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Project {
  id: number;
  title: string;
  category: string;
  description: string;
  image: string;
  created_at: string;
}

const API_URL = "http://localhost:3000";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/projects`);
      const data = await response.json();

      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data proyek:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="container">
      <section className="section" style={{ marginTop: "2rem" }}>
        <h2 className="section-title">Semua Proyek</h2>

        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Memuat proyek...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <p>Belum ada proyek yang tersedia.</p>
          </div>
        ) : (
          <div className="project-grid">
            {projects.map((project) => (
              <Link
                href={`/projects/${project.id}`}
                key={project.id}
                style={{ textDecoration: "none" }}
              >
                <div className="project-card">
                  <div>
                      <h3>{project.title}</h3>
                      <h5 className="category">{project.category}</h5>
                  </div>
                  <p>
                    {project.description
                      ? project.description.substring(0, 120) + "..."
                      : "Tidak ada deskripsi"}
                  </p>
                  <div className="card-footer">
                    <span>{formatDate(project.created_at)}</span>
                    <span className="view-detail">Lihat Detail →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}