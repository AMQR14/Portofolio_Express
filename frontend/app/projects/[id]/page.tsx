"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/projects/${id}`);
      const data = await response.json();

      if (data.success) {
        setProject(data.data);
      } else {
        setError(data.message || "Proyek tidak ditemukan");
      }
    } catch (err) {
      setError("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string);
    }
  }, [params.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Memuat detail proyek...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ marginTop: "2rem" }}>
        <Link href="/projects" className="back-link">
          ← Kembali ke Daftar Proyek
        </Link>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: "2rem" }}>
      <Link href="/projects" className="back-link">
        ← Kembali ke Daftar Proyek
      </Link>

      {project && (
        <div className="project-detail">
          <h1>{project.title}</h1>
          <h5 className="category">{project.category}</h5>
          <div className="meta">
            📅 Dibuat pada: {formatDate(project.created_at)}
          </div>
          <div className="description">
            {project.description || "Tidak ada deskripsi untuk proyek ini."}
          </div>
        </div>
      )}
    </div>
  );
}