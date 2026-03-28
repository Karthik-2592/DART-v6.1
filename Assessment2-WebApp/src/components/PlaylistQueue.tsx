import { useState, useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getGenreTheme } from "../utils/genreTheme";
import { type Song } from "./Categories";

export default function PlaylistQueue() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentSong = location.state?.song as Song | undefined;

  useEffect(() => {
    fetch("http://localhost:5000/songs")
      .then(res => res.json())
      .then(data => setSongs(data))
      .catch(err => console.error("Failed to fetch songs:", err));
  }, []);

  const queueSongs = useMemo(() => {
    if (songs.length === 0) return [];
    
    // Prioritize songs of the same genre as current song, then others
    let filtered = songs;
    if (currentSong) {
      const sameGenre = songs.filter(s => s.genre === currentSong.genre && s.id !== currentSong.id);
      const others = songs.filter(s => s.genre !== currentSong.genre && s.id !== currentSong.id);
      filtered = [...sameGenre, ...others];
    }
    
    return filtered.slice(0, 10); // Show top 10 as queue
  }, [songs, currentSong]);

  const handleDotClick = useCallback(
    (index: number) => {
      setStartIndex(index);
    },
    []
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -3;
    const rotateY = ((x - centerX) / centerX) * 3;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform =
      "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)";
  };

  return (
    <section className="hide-on-enter w-full mx-auto">
      {/* Toggle button */}
      <div className="flex items-center justify-between mb-12 mt-12">
        <h3 className="text-xl font-bold font-[var(--font-family-heading)] text-fg-primary flex items-center gap-2">
          🎶 {currentSong ? `More ${currentSong.genre} & Others` : "Up Next"}
        </h3>
        <button
          onClick={() => setIsVisible((v) => !v)}
          className="player-btn text-xs text-fg-muted hover:text-fg-primary bg-bg-card-hover border border-border rounded-full px-4 py-1.5 cursor-pointer transition-all duration-200"
        >
          {isVisible ? "Hide Queue" : "Show Queue"}
        </button>
      </div>

      {/* Collapsible queue */}
      <div
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          maxHeight: isVisible ? "400px" : "0px",
          opacity: isVisible ? 1 : 0,
          marginBottom: isVisible ? "0" : "-1rem",
        }}
      >
        <div className="flex items-center gap-6">
          {/* Cards Viewport */}
          <div className="flex-1 overflow-hidden px-6 py-6 -my-2 -mx-1">
            <div
              className="flex gap-8 transition-transform duration-500 ease-out"
              style={{ transform: `translateX(calc(${startIndex * -50}% - ${startIndex * 1}rem))` }}
            >
              {queueSongs.map((card) => {
                const theme = getGenreTheme(card.genre);
                return (
                  <div
                    key={card.id}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => navigate("/player", { state: { song: card } })}
                    className="queue-card relative shrink-0 w-[calc(50%-1rem)] h-68 bg-bg-card rounded-[4px] flex flex-row items-stretch cursor-pointer border border-border transition-transform"
                    style={{
                      "--card-theme-color": theme.color,
                      "--card-theme-glow": theme.glow,
                    } as React.CSSProperties}
                  >
                    {/* Left: 1:1 Image */}
                    <div className="shrink-0 h-full aspect-square bg-[#242435] rounded-l-[4px] border-r border-border flex flex-col items-center justify-center overflow-hidden">
                      {card.cover_path ? (
                        <img src={`http://localhost:5000/${card.cover_path}`} alt={card.title} className="w-full h-full object-cover pointer-events-none" />
                      ) : (
                        <svg className="w-8 h-8 text-fg-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      )}
                    </div>

                    {/* Right: Details */}
                    <div className="flex-1 flex flex-col justify-center min-w-0 p-5 z-10">
                      <h4 className="text-base font-bold font-[var(--font-family-heading)] text-fg-primary mb-1 line-clamp-1 truncate uppercase" style={{ fontVariant: "small-caps" }}>
                        {card.title}
                      </h4>
                      <p className="text-sm text-fg-secondary font-medium mb-0.5 line-clamp-1 truncate">
                        {card.artists}
                      </p>
                      <div className="h-2.5"></div>

                      <div className="flex-1 min-h-[0.5rem]" />

                      <div className="flex flex-row items-center gap-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ backgroundColor: `${theme.color}22`, color: theme.color, border: `1px solid ${theme.color}44` }}>
                          {card.genre}
                        </span>
                        <span className="text-[10px] text-fg-muted">{card.release_year}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pagination dots */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {Array.from({ length: Math.max(0, queueSongs.length - 1) }, (_, i) => (
            <button
              key={i}
              onClick={() => handleDotClick(i)}
              className={`rounded-full transition-all duration-300 cursor-pointer border-none ${
                i === startIndex
                  ? "w-6 h-2.5 bg-accent"
                  : "w-2.5 h-2.5 bg-fg-muted/30 hover:bg-fg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
