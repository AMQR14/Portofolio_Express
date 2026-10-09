"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import CertificatePdfPreview from "../components/CertificatePdfPreview";
import {
  ChevronDown,
  Star,
  Check,
  X,
  Pencil,
  Trash2,
  ArrowLeft,
  Plus,
} from "lucide-react";

const API_URL = "/backend";

interface Project {
  id: number;
  title: string;
  category: string;
  description: string;
  image: string;
  created_at: string;
  gallery?: string[];
  challenge?: string | null;
  approach?: string | null;
  outcome?: string | null;
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

interface Message {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
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

interface DeleteTarget {
  type: string;
  id: number;
  label: string;
}

function AdminImagePreview({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={`${className} admin-image-fallback`}
        role="img"
        aria-label={`${alt} unavailable`}
      >
        Preview unavailable
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

function isPdfUrl(url: string) {
  return /\.pdf(?:$|[?#])/i.test(url);
}

function parseGallery(value: string) {
  try {
    const gallery: unknown = JSON.parse(value || "[]");
    return Array.isArray(gallery)
      ? gallery.filter((image): image is string => typeof image === "string")
      : [];
  } catch {
    return [];
  }
}

function CategoryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const options = ["Frontend", "Backend", "Fullstack"];
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        !pickerRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className={`admin-category-picker ${open ? "open" : ""}`} ref={pickerRef}>
      <button
        type="button"
        className="admin-category-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={value ? "" : "placeholder"}>
          {value || "Choose a category"}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="admin-category-options" role="listbox" aria-label="Category">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={value === option}
              className={`admin-category-option ${value === option ? "selected" : ""}`}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              <span>{option}</span>
              {value === option && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type Tab =
  | "overview"
  | "projects"
  | "skills"
  | "certificates"
  | "testimonials"
  | "messages"
  | "profile";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [authStatus, setAuthStatus] = useState<
    "checking" | "authenticated" | "unauthenticated"
  >("checking");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginPending, setLoginPending] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<Profile>({
    name: "",
    title: "",
    bio: "",
    cv_url: "",
    github_url: "",
    linkedin_url: "",
    email: "",
    avatar: "",
  });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{
    type: string;
    data?: Record<string, unknown>;
  } | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deleteDialogRef = useRef<HTMLElement>(null);
  const deleteCancelRef = useRef<HTMLButtonElement>(null);
  const deleteConfirmRef = useRef<HTMLButtonElement>(null);
  const deleteTriggerRef = useRef<HTMLElement | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(
    null,
  );
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (type: string, text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [p, s, c, t, m, pr] = await Promise.allSettled([
        fetch(`${API_URL}/projects`).then((r) => r.json()),
        fetch(`${API_URL}/skills`).then((r) => r.json()),
        fetch(`${API_URL}/certificates`).then((r) => r.json()),
        fetch(`${API_URL}/testimonials`).then((r) => r.json()),
        fetch(`${API_URL}/admin/messages`, { credentials: "include" }).then(
          (r) => r.json(),
        ),
        fetch(`${API_URL}/profile`).then((r) => r.json()),
      ]);
      if (p.status === "fulfilled" && p.value?.success)
        setProjects(p.value.data);
      if (s.status === "fulfilled" && s.value?.success) setSkills(s.value.data);
      if (c.status === "fulfilled" && c.value?.success)
        setCertificates(c.value.data);
      if (t.status === "fulfilled" && t.value?.success)
        setTestimonials(t.value.data);
      if (m.status === "fulfilled" && m.value?.success)
        setMessages(m.value.data);
      if (pr.status === "fulfilled" && pr.value?.success && pr.value.data)
        setProfile(pr.value.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/auth/session`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Unable to check admin session.");
        return res.json();
      })
      .then((data) => {
        if (active) {
          setAuthStatus(
            data.authenticated ? "authenticated" : "unauthenticated",
          );
        }
      })
      .catch(() => {
        if (active) {
          setLoginError("Cannot connect to the server. Please try again.");
          setAuthStatus("unauthenticated");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    const timeout = window.setTimeout(() => {
      void fetchAll();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [authStatus, fetchAll]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    const interval = window.setInterval(() => {
      fetch(`${API_URL}/auth/session`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          if (!data.authenticated) {
            setAuthStatus("unauthenticated");
            window.dispatchEvent(
              new CustomEvent("portfolio-admin-auth-change", {
                detail: false,
              }),
            );
          }
        })
        .catch(() => {
          setLoginError("Cannot verify your admin session.");
          setAuthStatus("unauthenticated");
          window.dispatchEvent(
            new CustomEvent("portfolio-admin-auth-change", { detail: false }),
          );
        });
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [authStatus]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginPending(true);
    setLoginError("");
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.message || "Unable to sign in.");
        return;
      }
      setLoginPassword("");
      window.dispatchEvent(
        new CustomEvent<() => void>("portfolio-auth-transition", {
          detail: () => {
            setAuthStatus("authenticated");
            window.dispatchEvent(
              new CustomEvent("portfolio-admin-auth-change", {
                detail: true,
              }),
            );
          },
        }),
      );
    } catch {
      setLoginError("Cannot connect to the server. Please try again.");
    } finally {
      setLoginPending(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", data.message || "Unable to log out.");
        return;
      }
      window.dispatchEvent(
        new CustomEvent<() => void>("portfolio-auth-transition", {
          detail: () => {
            setAuthStatus("unauthenticated");
            setLoginError("");
            window.dispatchEvent(
              new CustomEvent("portfolio-admin-auth-change", {
                detail: false,
              }),
            );
          },
        }),
      );
    } catch {
      showToast("error", "Cannot connect to the server. Please try again.");
    }
  };

  const openModal = (type: string, data?: Record<string, unknown>) => {
    setModal({ type, data });
    if (data) {
      setFormValues(
        Object.fromEntries(
          Object.entries(data).map(([key, value]) => [
            key,
            key === "gallery" && Array.isArray(value)
              ? JSON.stringify(value)
              : key === "issued_date" && typeof value === "string"
                ? value.slice(0, 10)
                : String(value ?? ""),
          ]),
        ),
      );
    } else {
      setFormValues({});
    }
  };

  const closeModal = () => {
    setModal(null);
    setFormValues({});
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    const nextValue =
      name === "level" && value !== ""
        ? String(Math.min(100, Math.max(0, Number(value))))
        : name === "rating" && value !== ""
          ? String(Math.min(5, Math.max(1, Number(value))))
          : value;
    setFormValues((prev) => ({ ...prev, [name]: nextValue }));
  };

  const uploadFile = async (file: File, fieldName: string) => {
    if (file.size > 4 * 1024 * 1024) {
      showToast("error", "Files must be 4 MB or smaller.");
      return null;
    }

    setUploadingField(fieldName);
    try {
      const res = await fetch(`${API_URL}/uploads`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const data = await res.json();
      if (!res.ok || !data.success || typeof data.url !== "string") {
        showToast(
          "error",
          data.message || data.error || "File upload failed.",
        );
        return null;
      }
      showToast("success", "File uploaded.");
      return data.url;
    } catch {
      showToast("error", "Could not upload file. Check the server connection.");
      return null;
    } finally {
      setUploadingField(null);
    }
  };

  const handleModalFileChange = async (
    fieldName: string,
    file: File | undefined,
  ) => {
    if (!file) return;
    const url = await uploadFile(file, fieldName);
    if (url) setFormValues((prev) => ({ ...prev, [fieldName]: url }));
  };

  const handleModalGalleryChange = async (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0) return;

    let gallery = parseGallery(formValues.gallery || "");
    if (gallery.length + selectedFiles.length > 12) {
      showToast("error", "A project can have up to 12 detail screenshots.");
      return;
    }

    for (const file of selectedFiles) {
      const url = await uploadFile(file, "gallery");
      if (!url) return;
      gallery = [...gallery, url];
      setFormValues((previous) => ({
        ...previous,
        gallery: JSON.stringify(gallery),
      }));
    }
  };

  const removeGalleryImage = (url: string) => {
    const gallery = parseGallery(formValues.gallery || "").filter(
      (image) => image !== url,
    );
    setFormValues((previous) => ({
      ...previous,
      gallery: JSON.stringify(gallery),
    }));
  };

  const handleProfileFileChange = async (
    fieldName: string,
    file: File | undefined,
  ) => {
    if (!file) return;
    const url = await uploadFile(file, fieldName);
    if (url) setProfile((prev) => ({ ...prev, [fieldName]: url }));
  };

  const handleSave = async () => {
    if (!modal) return;
    if (uploadingField) {
      showToast("error", "Wait for the current upload to finish before saving.");
      return;
    }

    if (modal.type === "skills") {
      const level = Number(formValues.level);
      if (!Number.isFinite(level) || level < 0 || level > 100) {
        showToast("error", "Skill level must be between 0 and 100.");
        return;
      }
    }
    if (modal.type === "testimonials" && formValues.rating) {
      const rating = Number(formValues.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        showToast("error", "Testimonial rating must be a whole number from 1 to 5.");
        return;
      }
    }

    setSaving(true);
    const isEdit = !!modal.data?.id;
    const endpoint = `${API_URL}/${modal.type}${isEdit ? `/${modal.data!.id}` : ""}`;
    const method = isEdit ? "PUT" : "POST";

    const body: Record<string, unknown> = { ...formValues };
    if (body.level) body.level = Number(body.level);
    if (body.rating) body.rating = Number(body.rating);
    if (modal.type === "projects") {
      body.gallery = parseGallery(formValues.gallery || "");
    }

    try {
      const res = await fetch(endpoint, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", `${modal.type} saved successfully.`);
        closeModal();
        fetchAll(true);
      } else {
        showToast("error", data.message || "Operation failed.");
      }
    } catch {
      showToast("error", "Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (type: string, id: number, label: string) => {
    if (document.activeElement instanceof HTMLElement) {
      deleteTriggerRef.current = document.activeElement;
    }
    setDeleteTarget({ type, id, label });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const endpoint =
        deleteTarget.type === "messages"
          ? `${API_URL}/admin/messages/${deleteTarget.id}`
          : `${API_URL}/${deleteTarget.type}/${deleteTarget.id}`;
      const res = await fetch(endpoint, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", `${deleteTarget.label} deleted.`);
        setDeleteTarget(null);
        fetchAll(true);
      } else {
        showToast("error", data.message || "Delete failed.");
      }
    } catch {
      showToast("error", "Network error.");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!deleteTarget) {
      deleteTriggerRef.current?.focus();
      deleteTriggerRef.current = null;
      return;
    }
    if (!deleteDialogRef.current?.contains(document.activeElement)) {
      deleteCancelRef.current?.focus();
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deleting) setDeleteTarget(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [deleteTarget, deleting]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", "Profile updated successfully.");
      } else {
        showToast(
          "error",
          data.message || data.error || "Failed to update profile.",
        );
      }
    } catch {
      showToast("error", "Network error.");
    } finally {
      setSaving(false);
    }
  };

  const navItems: { tab: Tab; num: string; label: string }[] = [
    { tab: "overview", num: "01", label: "Overview" },
    { tab: "projects", num: "02", label: "Projects" },
    { tab: "skills", num: "03", label: "Skills" },
    { tab: "certificates", num: "04", label: "Certificates" },
    { tab: "testimonials", num: "05", label: "Testimonials" },
    { tab: "messages", num: "06", label: "Inquiries" },
    { tab: "profile", num: "07", label: "Profile & CV" },
  ];

  const modalFields: Record<
    string,
    { name: string; label: string; type?: string; options?: string[] }[]
  > = {
    projects: [
      { name: "title", label: "Title" },
      { name: "category", label: "Category" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "image", label: "Project Image", type: "image" },
      {
        name: "gallery",
        label: "Detail Screenshots (up to 12)",
        type: "gallery",
      },
      { name: "challenge", label: "Challenge", type: "textarea" },
      { name: "approach", label: "Approach", type: "textarea" },
      { name: "outcome", label: "Outcome", type: "textarea" },
    ],
    skills: [
      { name: "name", label: "Skill Name" },
      { name: "level", label: "Level (0–100)", type: "number" },
      {
        name: "category",
        label: "Category",
        type: "select",
        options: ["Frontend", "Backend", "Fullstack"],
      },
    ],
    certificates: [
      { name: "title", label: "Certificate Title" },
      { name: "issuer", label: "Issuer" },
      { name: "issued_date", label: "Date Issued", type: "date" },
      { name: "credential_url", label: "Credential URL" },
      {
        name: "image",
        label: "Certificate File (Image or PDF)",
        type: "certificate",
      },
    ],
    testimonials: [
      { name: "name", label: "Name" },
      { name: "role", label: "Role / Position" },
      { name: "company", label: "Company" },
      { name: "content", label: "Testimonial", type: "textarea" },
      { name: "avatar", label: "Avatar Image", type: "image" },
      { name: "rating", label: "Rating (1–5)", type: "number" },
    ],
  };

  const renderRatingStars = (rating: number) =>
    [1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={14}
        fill={i <= rating ? "var(--ctp-peach)" : "var(--ctp-surface1)"}
        stroke="none"
        style={{ display: "inline-block", marginRight: "2px" }}
      />
    ));

  if (authStatus === "checking") {
    return (
      <main className="admin-auth-screen" role="status">
        <div className="admin-auth-card">
          <div className="admin-auth-kicker">Private Area</div>
          <h1>Checking access</h1>
          <div className="loading-spinner" />
        </div>
      </main>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <main className="admin-auth-screen">
        <form className="admin-auth-card" onSubmit={handleLogin}>
          <Link href="/" className="admin-auth-home-link">
            <ArrowLeft size={14} aria-hidden="true" />
            <span>Back to portfolio</span>
          </Link>
          <div className="admin-auth-kicker">Owner Access</div>
          <h1>Admin sign in</h1>
          <p>Sign in to manage your portfolio content.</p>
          <label className="admin-auth-label" htmlFor="admin-password">
            Password
          </label>
          <input
            id="admin-password"
            className="admin-auth-input"
            type="password"
            autoComplete="current-password"
            maxLength={1024}
            value={loginPassword}
            onChange={(event) => setLoginPassword(event.target.value)}
            required
            autoFocus
          />
          {loginError && (
            <p className="admin-auth-error" role="alert">
              {loginError}
            </p>
          )}
          <button className="btn-save" type="submit" disabled={loginPending}>
            {loginPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="admin-layout">
      {/* Toast */}
      {toast && (
        <div
          className={`alert alert-${toast.type}`}
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            zIndex: 999,
            padding: "0.9rem 1.4rem",
            minWidth: "300px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          }}
        >
          {toast.type === "success" ? (
            <Check size={18} strokeWidth={2.5} />
          ) : (
            <X size={18} strokeWidth={2.5} />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Modal */}
      {modal && modal.type !== "profile" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            data-lenis-prevent
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                {modal.data ? "Edit" : "Add"} {modal.type.slice(0, -1)}
              </h3>
              <button
                className="modal-close"
                onClick={closeModal}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            {(modalFields[modal.type] || []).map((field) => (
              <div className="form-group" key={field.name}>
                <label>{field.label}</label>
                {field.type === "textarea" ? (
                  <textarea
                    name={field.name}
                    rows={4}
                    value={formValues[field.name] || ""}
                    onChange={handleFormChange}
                    placeholder={field.label}
                  />
                ) : field.type === "select" ? (
                  <CategoryPicker
                    value={formValues[field.name] || ""}
                    onChange={(value) =>
                      setFormValues((prev) => ({
                        ...prev,
                        [field.name]: value,
                      }))
                    }
                  />
                ) : field.type === "gallery" ? (
                  <div className="admin-file-field">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                      multiple
                      onChange={(event) => {
                        const files = event.currentTarget.files;
                        void handleModalGalleryChange(files);
                        event.currentTarget.value = "";
                      }}
                      disabled={uploadingField === "gallery"}
                    />
                    <span className="admin-gallery-help">
                      Add real project screenshots or detail views. Each image
                      can be up to 5 MB.
                    </span>
                    <span>
                      {parseGallery(formValues.gallery || "").length} / 12
                      screenshots
                    </span>
                    {uploadingField === "gallery" && (
                      <span>Uploading screenshot…</span>
                    )}
                    {parseGallery(formValues.gallery || "").length > 0 && (
                      <div className="admin-gallery-grid">
                        {parseGallery(formValues.gallery || "").map(
                          (image, index) => (
                            <div
                              className="admin-gallery-item"
                              key={`${image}-${index}`}
                            >
                              <AdminImagePreview
                                src={image}
                                alt={`Project screenshot ${index + 1}`}
                                className="admin-gallery-thumb"
                              />
                              <button
                                className="admin-gallery-remove"
                                type="button"
                                onClick={() => removeGalleryImage(image)}
                                aria-label={`Remove screenshot ${index + 1}`}
                                disabled={uploadingField === "gallery"}
                              >
                                ×
                              </button>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                ) : field.type === "image" || field.type === "certificate" ? (
                  <div className="admin-file-field">
                    <input
                      type="file"
                      accept={
                        field.type === "certificate"
                          ? "image/png,image/jpeg,image/webp,image/gif,image/avif,application/pdf,.pdf"
                          : "image/png,image/jpeg,image/webp,image/gif,image/avif"
                      }
                      onChange={(event) =>
                        void handleModalFileChange(
                          field.name,
                          event.target.files?.[0],
                        )
                      }
                      disabled={uploadingField === field.name}
                    />
                    {field.type === "certificate" && (
                      <span className="admin-gallery-help">
                        Choose a new file to replace the current certificate.
                        Leave this empty to keep the current file.
                      </span>
                    )}
                    {formValues[field.name] && (
                      <>
                        {field.type === "certificate" &&
                          isPdfUrl(formValues[field.name]) ? (
                          <iframe
                            src={`${formValues[field.name]}#toolbar=0&navpanes=0&view=FitH`}
                            title={`${field.label} preview`}
                            className="admin-certificate-pdf-preview"
                          />
                        ) : (
                          <AdminImagePreview
                            key={formValues[field.name]}
                            src={formValues[field.name]}
                            alt={`${field.label} preview`}
                            className="admin-image-preview"
                          />
                        )}
                        <a
                          href={formValues[field.name]}
                          target="_blank"
                          rel="noreferrer"
                          className="admin-file-link"
                        >
                          {isPdfUrl(formValues[field.name])
                            ? "Open certificate file"
                            : "Open full-size image"}
                        </a>
                      </>
                    )}
                    {uploadingField === field.name && <span>Uploading…</span>}
                  </div>
                ) : (
                  <input
                    type={field.type || "text"}
                    name={field.name}
                    value={formValues[field.name] || ""}
                    onChange={handleFormChange}
                    placeholder={field.label}
                    min={
                      field.name === "level"
                        ? "0"
                        : field.type === "number"
                          ? "1"
                          : undefined
                    }
                    step={
                      field.name === "level" || field.name === "rating"
                        ? "1"
                        : undefined
                    }
                    max={
                      field.name === "rating"
                        ? "5"
                        : field.name === "level"
                          ? "100"
                          : undefined
                    }
                  />
                )}
              </div>
            ))}
            <div className="modal-actions">
              <button className="btn-cancel" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleSave}
                disabled={saving || uploadingField !== null}
              >
                {saving ? "Saving…" : "Save Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-kicker">Studio Management</div>
        <h2>Control Room</h2>
        <Link href="/" className="admin-home-link">
          <ArrowLeft size={14} aria-hidden="true" />
          <span>Back to Home</span>
        </Link>
        <ul className="admin-nav">
          {navItems.map(({ tab, num, label }) => (
            <li key={tab}>
              <button
                className={`admin-nav-link ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                <span className="admin-nav-num">{num} /</span>
                <span>{label}</span>
                {tab === "messages" && messages.length > 0 && (
                  <span
                    style={{
                      marginLeft: "auto",
                      background: "var(--ctp-mauve)",
                      color: "var(--ctp-crust)",
                      borderRadius: "9999px",
                      padding: "0.15rem 0.5rem",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                    }}
                  >
                    {messages.length}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <button
          className="admin-logout-button"
          onClick={() => void handleLogout()}
        >
          Sign out
        </button>
      </aside>

      {/* Content */}
      <div className="admin-content">
        {loading && activeTab === "overview" && (
          <div className="ds-loading">
            <div className="loading-spinner" />
            <p>Loading studio data…</p>
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div>
            <div className="admin-header">
              <div>
                <h1>Studio Overview</h1>
                <p>Curated metrics and portfolio content status.</p>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  fontFamily: "Fira Code, monospace",
                  fontSize: "0.85rem",
                  color: "var(--ctp-subtext0)",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "var(--ctp-green)",
                    boxShadow: "0 0 10px var(--ctp-green)",
                  }}
                />
                <span>Live Studio · {currentTime}</span>
              </div>
            </div>

            <div className="admin-stats">
              {[
                {
                  label: "Projects",
                  value: projects.length,
                  tab: "projects" as Tab,
                },
                { label: "Skills", value: skills.length, tab: "skills" as Tab },
                {
                  label: "Certificates",
                  value: certificates.length,
                  tab: "certificates" as Tab,
                },
                {
                  label: "Testimonials",
                  value: testimonials.length,
                  tab: "testimonials" as Tab,
                },
                {
                  label: "Inquiries",
                  value: messages.length,
                  tab: "messages" as Tab,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="admin-stat-card"
                  style={{ cursor: "pointer" }}
                  onClick={() => setActiveTab(s.tab)}
                >
                  <div className="admin-stat-value">{s.value}</div>
                  <div className="admin-stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Quick Action Strip */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
                marginTop: "2rem",
              }}
            >
              <button className="btn-add" onClick={() => openModal("projects")}>
                <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
                <span>Add Project</span>
              </button>
              <button className="btn-add" onClick={() => openModal("skills")}>
                <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
                <span>Add Skill</span>
              </button>
              <button
                className="btn-add"
                onClick={() => openModal("certificates")}
              >
                <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
                <span>Add Certificate</span>
              </button>
              <button
                className="btn-add"
                onClick={() => openModal("testimonials")}
              >
                <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
                <span>Add Testimonial</span>
              </button>
            </div>
          </div>
        )}

        {/* ── PROJECTS ── */}
        {activeTab === "projects" && (
          <div>
            <div className="admin-header">
              <div>
                <h1>Projects</h1>
                <p>Manage and curate portfolio showcase items.</p>
              </div>
            </div>
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h3>All Projects ({projects.length})</h3>
                <button
                  className="btn-add"
                  onClick={() => openModal("projects")}
                >
                  <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
                  <span>Add Project</span>
                </button>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Preview</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.image ? (
                          <a
                            href={p.image}
                            target="_blank"
                            rel="noreferrer"
                            className="admin-preview-link"
                            aria-label={`Open ${p.title} project image in a new tab`}
                          >
                            <AdminImagePreview
                              key={p.image}
                              src={p.image}
                              alt={`${p.title} preview`}
                              className="admin-table-image"
                            />
                          </a>
                        ) : (
                          <span className="admin-image-empty">No image</span>
                        )}
                      </td>
                      <td
                        style={{
                          color: "var(--ctp-text)",
                          fontWeight: 600,
                        }}
                      >
                        {p.title}
                      </td>
                      <td>{p.category || "—"}</td>
                      <td style={{ fontFamily: "Fira Code, monospace" }}>
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-icon"
                            title="Edit"
                            onClick={() =>
                              openModal(
                                "projects",
                                p as unknown as Record<string, unknown>,
                              )
                            }
                            aria-label="Edit project"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="btn-icon danger"
                            title="Delete"
                            onClick={() =>
                              handleDelete("projects", p.id, p.title)
                            }
                            aria-label="Delete project"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {projects.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: "center",
                          color: "var(--ctp-subtext0)",
                          padding: "3rem",
                        }}
                      >
                        No projects recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SKILLS ── */}
        {activeTab === "skills" && (
          <div>
            <div className="admin-header">
              <div>
                <h1>Skills &amp; Capabilities</h1>
                <p>Manage the technical proficiencies listed on the website.</p>
              </div>
            </div>
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h3>All Skills ({skills.length})</h3>
                <button className="btn-add" onClick={() => openModal("skills")}>
                  <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
                  <span>Add Skill</span>
                </button>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Technology</th>
                    <th>Category</th>
                    <th>Proficiency</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {skills.map((s) => (
                    <tr key={s.id}>
                      <td
                        style={{
                          color: "var(--ctp-text)",
                          fontWeight: 600,
                        }}
                      >
                        {s.name}
                      </td>
                      <td>{s.category}</td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                          }}
                        >
                          <div
                            style={{
                              width: 100,
                              height: 6,
                              borderRadius: 9999,
                              background: "var(--ctp-surface1)",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${s.level}%`,
                                height: "100%",
                                background: "var(--ctp-mauve)",
                                borderRadius: 9999,
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontFamily: "Fira Code, monospace",
                              fontSize: "0.85rem",
                              color: "var(--ctp-mauve)",
                              fontWeight: 600,
                            }}
                          >
                            {s.level}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-icon"
                            title="Edit"
                            onClick={() =>
                              openModal(
                                "skills",
                                s as unknown as Record<string, unknown>,
                              )
                            }
                            aria-label="Edit skill"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="btn-icon danger"
                            title="Delete"
                            onClick={() =>
                              handleDelete("skills", s.id, s.name)
                            }
                            aria-label="Delete skill"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {skills.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          textAlign: "center",
                          color: "var(--ctp-subtext0)",
                          padding: "3rem",
                        }}
                      >
                        No skills recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CERTIFICATES ── */}
        {activeTab === "certificates" && (
          <div>
            <div className="admin-header">
              <div>
                <h1>Certificates</h1>
                <p>Manage verified credentials and issuer details.</p>
              </div>
            </div>
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h3>All Certificates ({certificates.length})</h3>
                <button
                  className="btn-add"
                  onClick={() => openModal("certificates")}
                >
                  <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
                  <span>Add Certificate</span>
                </button>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Preview</th>
                    <th>Title</th>
                    <th>Issuer</th>
                    <th>Issued Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((c) => (
                    <tr key={c.id}>
                      <td>
                        {c.image ? (
                          <a
                            href={c.image}
                            target="_blank"
                            rel="noreferrer"
                            className="admin-preview-link"
                            aria-label={`Open ${c.title} certificate in a new tab`}
                          >
                            {isPdfUrl(c.image) ? (
                              <div
                                className="admin-table-document"
                                role="img"
                                aria-label={`${c.title} PDF preview`}
                              >
                                <CertificatePdfPreview
                                  src={c.image}
                                  className="admin-table-pdf-preview"
                                  fit="contain"
                                />
                                <span className="admin-table-document-badge">
                                  PDF
                                </span>
                              </div>
                            ) : (
                              <AdminImagePreview
                                key={c.image}
                                src={c.image}
                                alt={`${c.title} preview`}
                                className="admin-table-image"
                              />
                            )}
                          </a>
                        ) : (
                          <span className="admin-image-empty">No image</span>
                        )}
                      </td>
                      <td
                        style={{
                          color: "var(--ctp-text)",
                          fontWeight: 600,
                        }}
                      >
                        {c.title}
                      </td>
                      <td>{c.issuer}</td>
                      <td style={{ fontFamily: "Fira Code, monospace" }}>
                        {c.issued_date
                          ? new Date(c.issued_date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-icon"
                            title="Edit"
                            onClick={() =>
                              openModal(
                                "certificates",
                                c as unknown as Record<string, unknown>,
                              )
                            }
                            aria-label="Edit certificate"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="btn-icon danger"
                            title="Delete"
                            onClick={() =>
                              handleDelete("certificates", c.id, c.title)
                            }
                            aria-label="Delete certificate"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {certificates.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: "center",
                          color: "var(--ctp-subtext0)",
                          padding: "3rem",
                        }}
                      >
                        No certificates recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TESTIMONIALS ── */}
        {activeTab === "testimonials" && (
          <div>
            <div className="admin-header">
              <div>
                <h1>Testimonials</h1>
                <p>Manage endorsements and feedback from clients.</p>
              </div>
            </div>
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h3>All Testimonials ({testimonials.length})</h3>
                <button
                  className="btn-add"
                  onClick={() => openModal("testimonials")}
                >
                  <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
                  <span>Add Testimonial</span>
                </button>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Rating</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {testimonials.map((t) => (
                    <tr key={t.id}>
                      <td>
                        {t.avatar ? (
                          <a href={t.avatar} target="_blank" rel="noreferrer">
                            <AdminImagePreview
                              key={t.avatar}
                              src={t.avatar}
                              alt={`${t.name} avatar`}
                              className="admin-table-avatar"
                            />
                          </a>
                        ) : (
                          <span className="admin-image-empty">No image</span>
                        )}
                      </td>
                      <td
                        style={{
                          color: "var(--ctp-text)",
                          fontWeight: 600,
                        }}
                      >
                        {t.name}
                      </td>
                      <td>{t.company || "—"}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          {renderRatingStars(t.rating)}
                        </div>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-icon"
                            title="Edit"
                            onClick={() =>
                              openModal(
                                "testimonials",
                                t as unknown as Record<string, unknown>,
                              )
                            }
                            aria-label="Edit testimonial"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="btn-icon danger"
                            title="Delete"
                            onClick={() =>
                              handleDelete("testimonials", t.id, t.name)
                            }
                            aria-label="Delete testimonial"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {testimonials.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: "center",
                          color: "var(--ctp-subtext0)",
                          padding: "3rem",
                        }}
                      >
                        No testimonials recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MESSAGES ── */}
        {activeTab === "messages" && (
          <div>
            <div className="admin-header">
              <div>
                <h1>Inquiries &amp; Messages</h1>
                <p>Incoming client requests sent through the contact form.</p>
              </div>
            </div>
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h3>All Inquiries ({messages.length})</h3>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sender</th>
                    <th>Email</th>
                    <th>Message</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((m) => (
                    <tr key={m.id}>
                      <td
                        style={{
                          color: "var(--ctp-text)",
                          fontWeight: 600,
                        }}
                      >
                        {m.name}
                      </td>
                      <td>
                        <a
                          href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(m.email)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "var(--ctp-mauve)",
                            textDecoration: "underline",
                            textUnderlineOffset: "3px",
                          }}
                        >
                          {m.email}
                        </a>
                      </td>
                      <td
                        style={{
                          maxWidth: "320px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={m.message}
                      >
                        {m.message}
                      </td>
                      <td style={{ fontFamily: "Fira Code, monospace" }}>
                        {m.created_at
                          ? new Date(m.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <button
                          className="btn-icon danger"
                          title="Delete message"
                          onClick={() =>
                            handleDelete("messages", m.id, "Message")
                          }
                          aria-label="Delete message"
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {messages.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: "center",
                          color: "var(--ctp-subtext0)",
                          padding: "3rem",
                        }}
                      >
                        No messages received yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PROFILE ── */}
        {activeTab === "profile" && (
          <div>
            <div className="admin-header">
              <div>
                <h1>Profile &amp; Biography</h1>
                <p>Manage your public personal details, CV link, and bio.</p>
              </div>
            </div>
            <div
              className="admin-panel"
              style={{ padding: "2.5rem", maxWidth: "680px" }}
            >
              {[
                { name: "name", label: "Full Name", type: "text" },
                { name: "title", label: "Professional Title", type: "text" },
                { name: "bio", label: "Editorial Bio / Statement", type: "textarea" },
                { name: "email", label: "Email Address", type: "email" },
                { name: "cv_url", label: "Curriculum Vitae (CV) PDF", type: "pdf" },
                { name: "github_url", label: "GitHub Profile URL", type: "url" },
                { name: "linkedin_url", label: "LinkedIn Profile URL", type: "url" },
                { name: "avatar", label: "Profile Image", type: "image" },
              ].map((field) => (
                <div className="form-group" key={field.name}>
                  <label>{field.label}</label>
                  {field.type === "textarea" ? (
                    <textarea
                      name={field.name}
                      rows={4}
                      value={profile[field.name as keyof Profile] || ""}
                      onChange={(e) =>
                        setProfile({ ...profile, [field.name]: e.target.value })
                      }
                      placeholder={field.label}
                    />
                  ) : field.type === "image" || field.type === "pdf" ? (
                    <div className="admin-file-field">
                      <input
                        type="file"
                        accept={
                          field.type === "image"
                            ? "image/png,image/jpeg,image/webp,image/gif,image/avif"
                            : "application/pdf"
                        }
                        onChange={(event) =>
                          void handleProfileFileChange(
                            field.name,
                            event.target.files?.[0],
                          )
                        }
                        disabled={uploadingField === field.name}
                      />
                      {profile[field.name as keyof Profile] &&
                        (field.type === "image" ? (
                          <>
                            <AdminImagePreview
                              key={profile[field.name as keyof Profile]}
                              src={profile[field.name as keyof Profile]}
                              alt="Profile image preview"
                              className="admin-image-preview admin-profile-preview"
                            />
                            <a
                              href={profile[field.name as keyof Profile]}
                              target="_blank"
                              rel="noreferrer"
                              className="admin-file-link"
                            >
                              Open full-size image
                            </a>
                          </>
                        ) : (
                          <a
                            href={profile[field.name as keyof Profile]}
                            target="_blank"
                            rel="noreferrer"
                            className="admin-file-link"
                          >
                            View current CV
                          </a>
                        ))}
                      {uploadingField === field.name && (
                        <span>Uploading…</span>
                      )}
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      name={field.name}
                      value={profile[field.name as keyof Profile] || ""}
                      onChange={(e) =>
                        setProfile({ ...profile, [field.name]: e.target.value })
                      }
                      placeholder={field.label}
                    />
                  )}
                </div>
              ))}
              <button
                className="btn-save"
                onClick={handleSaveProfile}
                disabled={saving}
                style={{ width: "100%", marginTop: "1rem" }}
              >
                {saving ? "Saving Changes…" : "Update Profile"}
              </button>
            </div>
          </div>
        )}
      </div>
      {deleteTarget && (
        <div
          className="admin-confirm-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setDeleteTarget(null);
            }
          }}
        >
          <section
            ref={deleteDialogRef}
            className="admin-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="admin-confirm-title"
            aria-describedby="admin-confirm-description"
            onKeyDown={(event) => {
              if (event.key !== "Tab") return;
              if (event.shiftKey && document.activeElement === deleteCancelRef.current) {
                event.preventDefault();
                deleteConfirmRef.current?.focus();
              } else if (
                !event.shiftKey &&
                document.activeElement === deleteConfirmRef.current
              ) {
                event.preventDefault();
                deleteCancelRef.current?.focus();
              }
            }}
          >
            <span className="admin-confirm-icon" aria-hidden="true">
              !
            </span>
            <h2 id="admin-confirm-title">Delete this item?</h2>
            <p id="admin-confirm-description">
              <strong>{deleteTarget.label}</strong> will be permanently removed.
              This action cannot be undone.
            </p>
            <div className="admin-confirm-actions">
              <button
                ref={deleteCancelRef}
                type="button"
                className="btn-cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                ref={deleteConfirmRef}
                type="button"
                className="admin-confirm-delete"
                onClick={() => void confirmDelete()}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
