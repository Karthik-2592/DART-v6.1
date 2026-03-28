import { type Song } from "./Categories";
import { useState, useEffect } from "react";

export default function TrackDetails({ song }: { song?: Song }) {
  const [favorited, setFavorited] = useState(false);

  // Sync favorited status from backend on load
  useEffect(() => {
    const userData = sessionStorage.getItem("soundshare_user");
    if (userData && song) {
      const user = JSON.parse(userData);
      fetch(`http://localhost:5000/favorites/user/${user.username}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setFavorited(data.some((fav: any) => fav.title === song.title));
          }
        })
        .catch(err => console.error("Error fetching favorite status:", err));
    } else {
      setFavorited(false);
    }
  }, [song]);

  const handleFavorite = async () => {
    const userData = sessionStorage.getItem("soundshare_user");
    
    // Toggle state visually for both guest and logged-in
    const nextState = !favorited;
    setFavorited(nextState);

    if (!userData) {
      console.log("[TRACK] Guest user toggled favorite visually.");
      return;
    }

    if (!song) return;

    const user = JSON.parse(userData);
    const method = nextState ? "POST" : "DELETE";
    const url = `http://localhost:5000/favorites?username=${user.username}&title=${encodeURIComponent(song.title)}`;

    try {
      const res = await fetch(url, { method });
      if (!res.ok) {
         // Revert if API fail
         setFavorited(!nextState);
         console.error("Favorite API call failed");
      }
    } catch (err) {
      setFavorited(!nextState);
      console.error("Favorite action critical failure:", err);
    }
  };

  return (
    <section className="hide-on-enter w-full mx-auto ">
      <div className="bg-bg-card border border-border rounded-2xl p-8">
        <div className="flex items-start justify-between gap-8">
          {/* Left: Details */}
          <div className="flex-1 space-y-5">
            <div>
              <h2 className="text-3xl font-bold font-[var(--font-family-heading)] text-fg-primary mb-1">
                {song?.title || "Unknown Track"}
              </h2>
              <p className="text-fg-secondary text-base">
                by{" "}
                <span className="text-accent font-medium">
                  {song?.artists || "Unknown Artist"}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm">
              <div>
                <span className="text-fg-muted">Release Year</span>
                <p className="text-fg-primary font-medium">{song?.release_year || "Unknown"}</p>
              </div>
            </div>

            {/* Genre tags */}
            <div className="flex items-center gap-2 flex-wrap">
              {song?.genre && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium bg-accent/15 text-accent border border-accent/20"
                >
                  {song.genre}
                </span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 pt-2">
            {/* Favourite (Heart) */}
            <button
              onClick={handleFavorite}
              className={`track-action-btn w-11 h-11 rounded-full border flex items-center justify-center cursor-pointer transition-all duration-200 ${
                favorited
                  ? "bg-accent/15 border-accent text-accent"
                  : "bg-bg-card-hover border-border text-fg-secondary hover:text-accent hover:border-accent/40"
              }`}
              title="Favourite"
            >
              <svg
                className="w-5 h-5"
                fill={favorited ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>

            {/* Share */}
            <button
              className="track-action-btn w-11 h-11 rounded-full bg-bg-card-hover border border-border text-fg-secondary hover:text-accent hover:border-accent/40 flex items-center justify-center cursor-pointer transition-all duration-200"
              title="Share"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
