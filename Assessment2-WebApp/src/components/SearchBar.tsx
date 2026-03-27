import { useState, useCallback } from "react";
import { CategoryCard, type Song } from "./Categories";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const currentQuery = query.trim();
      if (!currentQuery) return;
      
      fetch(`http://localhost:5000/search?q=${encodeURIComponent(currentQuery)}`)
        .then(res => res.json())
        .then(data => {
            setResults(data);
            setSearchedQuery(currentQuery);
            setHasSearched(true);
        })
        .catch(err => console.error("Search failed:", err));
    },
    [query]
  );

  return (
    <section className="content-margins py-12 scroll-section">
      <h2 className="text-2xl font-bold font-[var(--font-family-heading)] text-fg-primary mb-10 text-center">
        🔎 Discover More
      </h2>

      <form onSubmit={handleSearch} className="flex justify-center mb-16">
        <div
          className={`search-bar-wrap w-full max-w-2xl ${isFocused ? "search-bar-wrap--focused" : ""}`}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search tracks, artists, genres…"
            className="search-bar-input w-full p-4 rounded-full bg-bg-card text-fg-primary border border-border focus:outline-none focus:border-accent transition-colors"
            style={{ paddingLeft: "24px" }}
          />
        </div>
      </form>

      {hasSearched && results.length === 0 && (
         <div className="text-center text-fg-muted mt-8 mb-10">
           <p className="text-xl">No matches found for "{searchedQuery}"</p>
         </div>
      )}

      {results.length > 0 && (
        <div className="mb-10">
          <h3 className="text-2xl font-bold font-[var(--font-family-heading)] text-fg-primary mb-6 flex items-center gap-3">
            <span className="text-2xl">🔍</span>
            Results for "{searchedQuery}"
          </h3>
          <div className="grid grid-cols-5 gap-8">
            {results.map((song, i) => (
              <CategoryCard key={song.id} index={i} song={song} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
