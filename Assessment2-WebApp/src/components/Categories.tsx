import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getGenreTheme } from "../utils/genreTheme";
import { getMediaUrl } from "../utils/mediaUtils";
import { API_URL } from "../constants/api";

export interface Song {
  id: number;
  title: string;
  genre: string;
  release_year: number;
  cover_path: string;
  audio_path: string;
  artists: string;
  artist_usernames?: string;
  play_count?: number;
}

export interface Genre {
  name: string;
  emoji: string;
}

export const genres: Genre[] = [
  { name: "Electronic", emoji: "⚡" },
  { name: "Dubstep", emoji: "🎸" },
  { name: "Tropical House", emoji: "🏝" },
  { name: "Phonk", emoji: "💀" },
  { name: "Indie Pop", emoji: "🎤" },
  { name: "Progressive House", emoji: "🎹" },
  { name: "Drumstep", emoji: "🥁" },
  { name: "Future House", emoji: "🏠" },
  { name: "Bass", emoji: "🔊" },
  { name: "Trap", emoji: "⛓️" },
  { name: "Melodic Dubstep", emoji: "✨" },
  { name: "Hardstyle", emoji: "🔨" },
  { name: "Glitch Hop", emoji: "👾" },
  { name: "Drum & Bass", emoji: "🌀" }
];

export function CategoryCard({ index, song, genreName, contextSongs }: { index: number, song: Song | null, genreName?: string, contextSongs?: Song[] }) {
  const navigate = useNavigate();
  const theme = getGenreTheme(genreName || (song ? song.genre : "Unknown"));

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!song) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8; // Increased for smaller card impact
    const rotateY = ((x - centerX) / centerX) * 8;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.04)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
  };

  // Derive display info from file or placeholders
  const trackName = song ? song.title : `Track ${index + 1}`;
  const artistName = song ? song.artists : "Various Artists";

  return (
    <button
      onClick={() => song && navigate(`/player/${song.id}`, { state: { song, contextSongs } })}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`card-trace bg-bg-card w-full aspect-[4/5] flex flex-col items-stretch mx-auto transition-transform duration-100 ease-out ${song ? "cursor-pointer hover:bg-bg-card-hover" : "cursor-default opacity-50"}`}
      disabled={!song}
      style={{
        "--card-theme-color": theme.color,
        "--card-theme-glow": theme.glow,
      } as React.CSSProperties}
    >
      <div className="w-full h-full flex flex-col items-stretch overflow-hidden rounded-[4px] relative z-10 pointer-events-none">
        {/* Top: 1:1 aspect picture */}
        <div className="shrink-0 w-full aspect-square bg-[#242435] border-b border-border flex items-center justify-center overflow-hidden">
          {song && song.cover_path ? (
            <img
              src={getMediaUrl(song.cover_path, 'cover')}
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
    const sorted = [...genreSongs].sort((a, b) => {
      if ((b.play_count || 0) !== (a.play_count || 0)) {
        return (b.play_count || 0) - (a.play_count || 0);
      }
      return 0.5 - Math.random();
    });
    return sorted.slice(0, 5);
  }, [genre.name, songs]);

  const isLoading = songs.length === 0;

  return (
    <div className="mb-20 min-h-[400px]">
      <h3 className="text-2xl font-bold font-[var(--font-family-heading)] text-fg-primary mb-8 flex items-center gap-3 tracking-tight">
        <span className="text-3xl filter saturate-150">{genre.emoji}</span>
        {genre.name}
      </h3>

      <div className={`scroll-section grid grid-cols-2 md:grid-cols-5 gap-8 ${isLoading ? "opacity-0 pointer-events-none" : "animate-[fadeIn_1.2s_ease-out] opacity-100"}`}>
        {Array.from({ length: 5 }, (_, i) => {
          const song = !isLoading && i < displaySongs.length ? displaySongs[i] : null;
          return <CategoryCard key={i} index={i} song={song} genreName={genre.name} />;
        })}
      </div>
    </div>
  );
}

export default function Categories({ songs }: { songs: Song[] }) {
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);

  useEffect(() => {
    const sessionUserStr = sessionStorage.getItem("dart_v6_1_user");
    if (sessionUserStr) {
      try {
        const u = JSON.parse(sessionUserStr);
        setUser(u);

        fetch(`${API_URL}/favorites/user/${u.username}`)
          .then(res => res.json())
          .then(data => setFavorites(data))
          .catch(err => console.error(err));

        fetch(`${API_URL}/playlists/user/${u.username}`)
          .then(res => res.json())
          .then(data => setPlaylists(data))
          .catch(err => console.error(err));
      } catch (err) { console.error(err); }
    }
  }, []);

  const getTopSongs = (songList: Song[], max: number = 5) => {
    return [...songList].sort((a, b) => {
      if ((b.play_count || 0) !== (a.play_count || 0)) {
        return (b.play_count || 0) - (a.play_count || 0);
      }
      return 0.5 - Math.random();
    }).slice(0, max);
  };

  return (
    <section className="content-margins pb-24 pt-8">
      <div className="mb-16">
        <h2 className="text-4xl font-extrabold font-[var(--font-family-heading)] text-fg-primary mb-12 tracking-tighter">
          🎵 Browse by Genre
        </h2>
      </div>
      {genres.map((genre) => (
        <GenreSection key={genre.name} genre={genre} songs={songs} />
      ))}

      {user && favorites.length > 0 && (
        <div className="mb-20">
          <h2 className="text-4xl font-extrabold font-[var(--font-family-heading)] text-fg-primary mb-12 tracking-tighter">
            ❤️ Favorites
          </h2>
          <div className="mb-14">
            <div className="scroll-section grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8">
              {Array.from({ length: 5 }, (_, i) => {
                const topFavs = getTopSongs(favorites);
                const song = i < topFavs.length ? topFavs[i] : null;
                return <CategoryCard key={i} index={i} song={song} contextSongs={favorites} />;
              })}
            </div>
          </div>
        </div>
      )}

      {user && playlists.length > 0 && (
        <div className="mb-20">
          <h2 className="text-4xl font-extrabold font-[var(--font-family-heading)] text-fg-primary mb-12 tracking-tighter">
            🎶 Your Playlists
          </h2>
          {playlists.slice(0, 2).map((pl: any) => (
            <div key={pl.id} className="mb-14">
              <h3 className="text-xl font-bold font-[var(--font-family-heading)] text-fg-primary mb-6 flex items-center gap-3">
                <span className="text-xl">💿</span>
                {pl.name}
              </h3>
              <div className="scroll-section grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8">
                {Array.from({ length: 5 }, (_, i) => {
                  const plSongs = pl.songs || [];
                  const song = i < plSongs.length ? plSongs[i] : null;
                  return <CategoryCard key={i} index={i} song={song} contextSongs={plSongs} />;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
