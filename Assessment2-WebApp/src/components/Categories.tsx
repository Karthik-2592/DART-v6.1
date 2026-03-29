import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getGenreTheme } from "../utils/genreTheme";

export interface Song {
  id: number;
  title: string;
  genre: string;
  release_year: number;
  cover_path: string;
  audio_path: string;
  artists: string;
  artist_usernames: string;
}

interface Genre {
  name: string;
  emoji: string;
}

const genres: Genre[] = [
  { name: "Electronic", emoji: "⚡" },
  { name: "Dubstep", emoji: "🎸" },
  { name: "Tropical House", emoji: "🏝" },
  { name: "Phonk", emoji: "💀" },
  { name: "Indie Pop", emoji: "🎤" },
  { name: "Progressive House", emoji: "🎹" },
  { name: "Drumstep", emoji: "🥁" },
];

export function CategoryCard({ index, song, genreName, contextSongs }: { index: number, song: Song | null, genreName?: string, contextSongs?: Song[] }) {
  const navigate = useNavigate();
  const theme = getGenreTheme(genreName || (song ? song.genre : "Unknown"));

  // Derive display info from file or placeholders
  const trackName = song ? song.title : `Track ${index + 1}`;
  const artistName = song ? song.artists : "Various Artists";

  return (
    <button
      onClick={() => song && navigate("/player", { state: { song, contextSongs } })}
      className={`card-trace bg-bg-card w-full aspect-[4/5] flex flex-col items-stretch mx-auto ${song ? "cursor-pointer hover:bg-bg-card-hover" : "cursor-default opacity-50"}`}
      disabled={!song}
      style={{
        "--card-theme-color": theme.color,
        "--card-theme-glow": theme.glow,
      } as React.CSSProperties}
    >
      <div className="w-full h-full flex flex-col items-stretch overflow-hidden rounded-[4px] relative z-10">
        {/* Top: 1:1 aspect picture */}
        <div className="shrink-0 w-full aspect-square bg-[#242435] border-b border-border flex items-center justify-center overflow-hidden">
          {song && song.cover_path ? (
            <img
              src={song.cover_path && !song.cover_path.includes('/') ? `http://localhost:5000/cover/${song.cover_path}` : `http://localhost:5000/${song.cover_path}`}
              alt={song.title}
              className="w-full h-full object-cover pointer-events-none"
            />
          ) : (
            <svg
              className="w-10 h-10 text-fg-muted/20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          )}
        </div>

        {/* Bottom: Song description */}
        <div className="flex-1 p-3 flex flex-col justify-center items-start text-left min-w-0">
          <h4 className="text-[11px] font-bold text-fg-primary truncate w-full line-clamp-1">
            {trackName}
          </h4>
          <p className="text-[10px] text-fg-secondary truncate w-full line-clamp-1 mt-0.5">
            {artistName}
          </p>
        </div>
      </div>
    </button>
  );
}

function GenreSection({ genre, songs }: { genre: Genre, songs: Song[] }) {
  // Select up to 5 random songs for this genre
  const displaySongs = useMemo(() => {
    const genreSongs = songs.filter(s => s.genre.toLowerCase() === genre.name.toLowerCase());
    if (genreSongs.length <= 5) return genreSongs;
    return [...genreSongs].sort(() => 0.5 - Math.random()).slice(0, 5);
  }, [genre.name, songs]);

  if (displaySongs.length === 0) return null;

  return (
    <div className="mb-14 ">
      <h3 className="text-3xl font-bold font-[var(--font-family-heading)] text-fg-primary mb-6 flex items-center gap-3">
        <span className="text-3xl">{genre.emoji}</span>
        {genre.name}
      </h3>

      <div className="scroll-section grid grid-cols-5 gap-8">
        {Array.from({ length: 5 }, (_, i) => {
          const song = i < displaySongs.length ? displaySongs[i] : null;
          return <CategoryCard key={i} index={i} song={song} genreName={genre.name} />;
        })}
      </div>
    </div>
  );
}

export default function Categories() {
  const [songs, setSongs] = useState<Song[]>([]);
  
  useEffect(() => {
    fetch("http://localhost:5000/songs")
      .then(res => res.json())
      .then(data => setSongs(data))
      .catch(err => console.error("Failed to fetch songs:", err));
  }, []);

  return (
    <section className="content-margins pb-12">
      <h2 className="text-2xl font-bold font-[var(--font-family-heading)] text-fg-primary mb-10">
        🎵 Browse by Genre
      </h2>
      {genres.map((genre) => (
        <GenreSection key={genre.name} genre={genre} songs={songs} />
      ))}
    </section>
  );
}
