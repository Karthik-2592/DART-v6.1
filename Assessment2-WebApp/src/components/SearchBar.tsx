import { useState, useCallback, useEffect, useRef } from "react";
import { CategoryCard, type Song } from "./Categories";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { API_URL } from "../constants/api";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const emptyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.location.hash === "#search-section") {
      document.getElementById("search-section")?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    // Kill existing animations on this ref to prevent conflict during rapid searches
    if (resultsRef.current) {
       gsap.killTweensOf(resultsRef.current);
    }
    
    if (results.length > 0 && resultsRef.current) {
      gsap.fromTo(resultsRef.current,
        { opacity: 0, y: 30, filter: "blur(10px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power2.out", delay: 0.05, onComplete: () => ScrollTrigger.refresh() }
      );
    } else {
        ScrollTrigger.refresh();
    }
  }, [results]);

  useEffect(() => {
    if (hasSearched && results.length === 0 && emptyRef.current) {
      gsap.fromTo(emptyRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [hasSearched, results]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const currentQuery = query.trim();
      if (!currentQuery) return;
      
      setIsLoading(true);
      setHasSearched(false); // Hide previous results while loading

      fetch(`${API_URL}/songs/search?q=${encodeURIComponent(currentQuery)}`)
        .then(res => res.json())
        .then(data => {
            setResults(data);
            setSearchedQuery(currentQuery);
            setHasSearched(true);
            setIsLoading(false);
        })
        .catch(err => {
            console.error("Search failed:", err);
            setIsLoading(false);
        });
    },
    [query]
  );

  return (
    <section id="search-section" className="content-margins pt-12 scroll-section transition-all duration-700 min-h-[400px]">
      <h2 className="text-2xl font-bold font-[var(--font-family-heading)] text-fg-primary mb-10 text-center">
        🔎 Discover More
      </h2>

      <form onSubmit={handleSearch} className="flex justify-center mb-16">
        <div
          className={`search-bar-wrap w-full max-w-2xl ${isFocused ? "search-bar-wrap--focused" : ""} ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isLoading ? "Searching..." : "Search tracks, artists, genres…"}
            disabled={isLoading}
            className="search-bar-input w-full p-4 rounded-full bg-bg-card text-fg-primary border border-border focus:outline-none focus:border-accent transition-colors"
            style={{ paddingLeft: "24px" }}
          />
        </div>
      </form>

      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 animate-pulse transition-opacity duration-300">
           <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
           <p className="text-fg-muted italic text-sm">Searching our library...</p>
        </div>
      )}

      {!isLoading && hasSearched && results.length === 0 && (
         <div ref={emptyRef} className="text-center text-fg-muted mt-8 mb-10">
           <p className="text-xl">No matches found for "{searchedQuery}"</p>
         </div>
      )}

      {results.length > 0 && (
        <div ref={resultsRef} className="mb-10 opacity-0 transform translate-y-8 blur-sm">
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
