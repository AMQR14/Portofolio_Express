"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLenisScroll } from "./LenisProvider";
import { ArrowUp, Clock } from "lucide-react";

const API_URL = "/backend";

export default function Footer() {
  const pathname = usePathname();
  const lenisScrollTo = useLenisScroll();
  const year = new Date().getFullYear();
  const [timeStr, setTimeStr] = useState("");
  const [developerName, setDeveloperName] = useState("Dennis Snellenberg");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/profile`);
        const data = await response.json();
        if (data.success && data.data?.name) {
          setDeveloperName(data.data.name);
        }
      } catch (error) {
        console.error("Unable to load footer profile name:", error);
      }
    };
    fetchProfile();
  }, []);

  if (pathname === "/" || pathname.startsWith("/admin")) {
    return null;
  }

  const scrollToTop = () => {
    lenisScrollTo(0);
  };

  return (
    <footer className="ds-cta-section">
      <div className="ds-cta-container">
        <div className="ds-bottom-bar">
          <div>
            <span>
              © {year} {developerName}. All rights reserved.
            </span>
          </div>

          <div className="ds-local-time">
            <Clock size={13} style={{ opacity: 0.7 }} />
            <span>LOCAL TIME {timeStr || "GMT+8"}</span>
          </div>

          <div>
            <button
              onClick={scrollToTop}
              className="ds-back-to-top"
              aria-label="Back to top"
            >
              <span>Back to top</span>
              <ArrowUp size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
