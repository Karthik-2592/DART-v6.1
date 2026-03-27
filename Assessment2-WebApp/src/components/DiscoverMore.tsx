import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { type Song, CategoryCard } from "./Categories";

interface Genre {
  name: string;
  emoji: string;
}

const allGenres: Genre[] = [
  { name: "Electronic", emoji: "⚡" },
  { name: "Dubstep", emoji: "🎸" },
  { name: "Tropical House", emoji: "🏝" },
  { name: "Phonk", emoji: "💀" },
  { name: "Indie Pop", emoji: "🎤" },
  { name: "Progressive House", emoji: "🎹" },
  { name: "Drumstep", emoji: "🥁" },
];

function GenreRow({ genre, songs }: { genre: Genre, songs: Song[] }) {
  const displaySongs = useMemo(() => {
    const genreSongs = songs.filter(s => s.genre.toLowerCase() === genre.name.toLowerCase());
    if (genreSongs.length <= 5) return genreSongs;
    return [...genreSongs].sort(() => 0.5 - Math.random()).slice(0, 5);
  }, [genre.name, songs]);

  if (displaySongs.length === 0) return null;

  return (
    <div className="mb-14">
      <h3 className="text-3xl font-bold font-[var(--font-family-heading)] text-fg-primary mb-6 flex items-center gap-3">
        <span className="text-3xl">{genre.emoji}</span>
        {genre.name}
      </h3>

      <div className="grid grid-cols-5 gap-8">
        {Array.from({ length: 5 }, (_, i) => {
          const song = i < displaySongs.length ? displaySongs[i] : null;
          return <CategoryCard key={i} index={i} song={song} genreName={genre.name} />;
        })}
      </div>
    </div>
  );
}

export default function DiscoverMore() {
  const [songs, setSongs] = useState<Song[]>([]);
  
  useEffect(() => {
    fetch("http://localhost:5000/songs")
      .then(res => res.json())
      .then(data => setSongs(data))
      .catch(err => console.error("Failed to fetch songs:", err));
  }, []);

  // Pick 3 random genres to show
  const genresToShow = useMemo(() => {
    return [...allGenres].sort(() => 0.5 - Math.random()).slice(0, 3);
  }, []);

  return (
    <section className="hide-on-enter content-margins py-12">
      <h2 className="text-2xl font-bold font-[var(--font-family-heading)] text-fg-primary mb-10">
        🎵 Discover More
      </h2>

      {genresToShow.map((genre) => (
        <GenreRow key={genre.name} genre={genre} songs={songs} />
      ))}

      {/* CTA → back to landing page */}
      <div className="scroll-section mt-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-bg-secondary via-bg-card to-bg-secondary border border-border p-16 text-center">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-accent/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-accent-light/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <h2 className="text-4xl font-bold font-[var(--font-family-heading)] text-fg-primary mb-4">
              Explore the Full Library
            </h2>
            <p className="text-fg-secondary text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Head back to the home page to browse all genres, discover trending
              tracks, and find your next favourite song.
            </p>

            <Link to="/" className="no-underline">
              <button className="btn-accent text-lg px-10 py-4">
                ← Back to Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
