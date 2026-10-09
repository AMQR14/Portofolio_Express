"use client";

import { useEffect, useState } from "react";

const WORDS = [
  "Hello",
  "Bonjour",
  "स्वागत हे",
  "Ciao",
  "Olá",
  "おい",
  "Hallå",
  "Guten tag",
  "Hallo",
];

export default function Preloader() {
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let currentIndex = 0;
    let finishTimeout: ReturnType<typeof setTimeout>;
    let hideTimeout: ReturnType<typeof setTimeout>;

    const wordInterval = setInterval(() => {
      currentIndex += 1;
      setIndex(currentIndex);

      if (currentIndex === WORDS.length - 1) {
        clearInterval(wordInterval);
        finishTimeout = setTimeout(() => {
          setLoading(false);
          hideTimeout = setTimeout(() => setHidden(true), 1050);
        }, 250);
      }
    }, 220);

    return () => {
      clearInterval(wordInterval);
      clearTimeout(finishTimeout);
      clearTimeout(hideTimeout);
    };
  }, []);

  if (hidden) return null;

  return (
    <div className={`ds-preloader ${loading ? "active" : "exit"}`}>
      <div className="ds-preloader-content">
        <h2 className="ds-preloader-word">
          <span className="ds-preloader-current-word" key={WORDS[index]}>
            {WORDS[index]}
          </span>
          <span className="ds-preloader-dot" />
        </h2>
      </div>
    </div>
  );
}
