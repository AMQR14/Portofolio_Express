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

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setAlert(null);

    try {
      const response = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setAlert({
          type: "success",
          text: "Pesan berhasil dikirim! Terima kasih 🎉",
        });
        setFormData({ name: "", email: "", message: "" }); // Reset form
      } else {
        setAlert({
          type: "error",
          text: data.message || "Gagal mengirim pesan",
        });
      }
    } catch (error) {
      setAlert({ type: "error", text: "Tidak bisa terhubung ke server" });
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="container">
      <section className="hero">
        <h1>Selamat Datang di Portfolio Saya</h1>
        <p>
          Saya seorang developer yang senang membangun aplikasi web modern.
          Berikut adalah proyek-proyek yang sudah saya kerjakan.
        </p>
      </section>

      <section className="section">
        <h2 className="section-title">Proyek Terbaru</h2>

        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Memuat proyek...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <p>Belum ada proyek. Tambahkan melalui API backend!</p>
          </div>
        ) : (
          <div className="project-grid">
            {projects.slice(0, 3).map((project) => (
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

        {projects.length > 3 && (
          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <Link href="/projects" className="back-link">
              Lihat Semua Proyek →
            </Link>
          </div>
        )}
      </section>

      <section className="section" id="contact">
        <h2 className="section-title">Kirim Pesan</h2>

        {alert && (
          <div className={`alert alert-${alert.type}`}>{alert.text}</div>
        )}

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nama</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Masukkan nama kamu"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Masukkan email kamu"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Pesan</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Tulis pesan kamu di sini..."
              required
            ></textarea>
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={
              sending ||
              formData.name == "" ||
              formData.message == "" ||
              formData.email == "" ||
              !emailRegex.test(formData.email)
            }
          >
            {sending ? "Mengirim..." : "Kirim Pesan"}
          </button>
        </form>
      </section>
    </div>
  );
}
