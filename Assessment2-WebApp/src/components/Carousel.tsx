import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { getGenreTheme } from "../utils/genreTheme";
import { type Song } from "./Categories";

export default function Carousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [songs, setSongs] = useState<Song[]>([]);
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetch("http://localhost:5000/songs")
      .then((res) => res.json())
      .then((data: Song[]) => {
        if (data && data.length > 0) {
          const sorted = [...data].sort((a, b) => {
            if ((b.play_count || 0) !== (a.play_count || 0)) {
              return (b.play_count || 0) - (a.play_count || 0);
            }
            return 0.5 - Math.random();
          });
          setSongs(sorted.slice(0, 5));
        }
      })
      .catch((err) => console.error("Carousel fetch error:", err));
  }, []);

  useEffect(() => {
    if (songs.length > 0 && sectionRef.current) {
      gsap.fromTo(sectionRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
      );
    }
  }, [songs]);
  const handlePrev = useCallback(() => {
    if (songs.length === 0) return;
    const next = activeIndex === 0 ? songs.length - 1 : activeIndex - 1;
    animateSlide(next, -1);
  }, [activeIndex, songs.length]);

  const handleNext = useCallback(() => {
    if (songs.length === 0) return;
    const next = activeIndex === songs.length - 1 ? 0 : activeIndex + 1;
    animateSlide(next, 1);
  }, [activeIndex, songs.length]);

  const handleDotClick = useCallback(
    (index: number) => {
      if (index === activeIndex) return;
      const direction = index > activeIndex ? 1 : -1;
      animateSlide(index, direction);
    },
    [activeIndex]
  );

  const animateSlide = (nextIndex: number, direction: number) => {
    if (!cardRef.current) {
      setActiveIndex(nextIndex);
      return;
    }
    gsap.to(cardRef.current, {
      x: direction * -120,
      opacity: 0,
      scale: 0.92,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        setActiveIndex(nextIndex);
        gsap.fromTo(
          cardRef.current,
          { x: direction * 120, opacity: 0, scale: 0.92 },
          { x: 0, opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" }
        );
      },
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform =
      "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)";
  };

  if (songs.length === 0) {
    return (
      <section className="section-margins scroll-section text-fg-primary pt-12 pb-24 opacity-0">
        <div className="h-160" />
      </section>
    );
  }

  const current = songs[activeIndex];
  const theme = getGenreTheme(current.genre);
  return (
    <section ref={sectionRef} className="section-margins scroll-section text-fg-primary pt-3 pb-24 opacity-0">
      <h2 className="text-2xl font-bold font-[var(--font-family-heading)] text-fg-primary mb-21">
        🔥 Featured
      </h2>

      <div
        className="flex items-center justify-center gap-24 h-160"
      >
        {/* Left arrow */}
        <button
          onClick={handlePrev}
          className="shrink-0 w-12 h-12 rounded-full bg-bg-card border border-border hover:border-accent/50 hover:bg-bg-card-hover flex items-center justify-center transition-all duration-300 cursor-pointer group z-10"
        >
          <svg
            className="w-5 h-5 text-fg-secondary group-hover:text-accent transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Card */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={() => navigate(`/player/${current.id}`, { state: { song: current } })}
          className="carousel-card relative max-w-400 w-full h-full cursor-pointer bg-bg-card hover:bg-bg-card-hover rounded-[4px] flex flex-row items-stretch transition-transform"
          style={{
            "--card-theme-color": theme.color,
            "--card-theme-glow": theme.glow,
          } as React.CSSProperties}
        >
          {/* Card left: 1:1 image or placeholder */}
          <div className="shrink-0 h-full aspect-square bg-[#242435] rounded-l-[4px] border-r border-border flex flex-col items-center justify-center overflow-hidden">
            {current.cover_path ? (
              <img
                src={current.cover_path && !current.cover_path.includes('/') ? `http://localhost:5000/cover/${current.cover_path}` : `http://localhost:5000/${current.cover_path}`}
                alt={current.title}
                className="w-full h-full object-cover pointer-events-none"
              />
            ) : (
              // Default Music Icon if no picture is available
              <svg
                className="w-16 h-16 text-fg-muted/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            )}
          </div>

          {/* Card right: Details */}
          <div className="flex-1 flex flex-col justify-center min-w-0 p-8 z-10">
            {/* 1. Name of the song in Small Caps */}
            <h3 className="text-3xl font-bold font-[var(--font-family-heading)] text-fg-primary mb-2 line-clamp-1 truncate" style={{ fontVariant: "small-caps" }}>
              {current.title || "Unknown Title"}
            </h3>

            {/* 2. Name of the artist */}
            <p className="text-lg text-fg-secondary font-medium mb-1 line-clamp-1 truncate">
              {current.artists || "Unknown Artist"}
            </p>

            {/* 3. Name of featured artists, producers, etc... (Placeholder) */}
            <div className="h-5"></div>

            {/* Gap spacer */}
            <div className="flex-1 min-h-[1.5rem]" />

            {/* 4. Major Genre and 5. Release year */}
            <div className="flex flex-row items-center gap-4 mt-auto">
              <span
                className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                style={{ backgroundColor: `${theme.color}22`, color: theme.color, border: `1px solid ${theme.color}44` }}
              >
                {current.genre || "Unknown Genre"}
              </span>

              <span className="text-sm text-fg-muted font-[var(--font-family-body)]">
                {current.release_year || "Unknown Year"}
              </span>
            </div>
          </div>
        </div>

        {/* Right arrow */}
        <button
          onClick={handleNext}
          className="shrink-0 w-12 h-12 rounded-full bg-bg-card border border-border hover:border-accent/50 hover:bg-bg-card-hover flex items-center justify-center transition-all duration-300 cursor-pointer group z-10"
        >
          <svg
            className="w-5 h-5 text-fg-secondary group-hover:text-accent transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Pagination dots */}
      <div className="flex items-center justify-center gap-2.5 mt-8">
        {songs.map((card, index) => (
          <button
            key={card.id || index}
            onClick={() => handleDotClick(index)}
            className={`rounded-full transition-all duration-400 cursor-pointer border-none ${index === activeIndex
                ? "w-8 h-3"
                : "w-3 h-3 bg-fg-muted/40 hover:bg-fg-muted"
              }`}
            style={index === activeIndex ? { backgroundColor: theme.color, boxShadow: `0 0 10px ${theme.glow}` } : {}}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
