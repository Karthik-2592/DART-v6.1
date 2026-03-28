import { type Song } from "./Categories";
import { useState } from "react";

export default function TrackDetails({ song }: { song?: Song }) {
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);

  const handleFavorite = async () => {
    const userData = sessionStorage.getItem("soundshare_user");
    if (!userData) {
      console.warn("Please log in to favorite songs!");
      return;
    }

    if (!song) return;

    const user = JSON.parse(userData);
    const method = favorited ? "DELETE" : "POST";
    const url = `http://localhost:5000/favorites?username=${user.username}&title=${encodeURIComponent(song.title)}`;

    try {
      const res = await fetch(url, { method });
      if (res.ok) {
        setFavorited(!favorited);
      }
    } catch (err) {
      console.error("Favorite action failed:", err);
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
            {/* Like */}
            <button
              onClick={() => setLiked((l) => !l)}
              className={`track-action-btn w-11 h-11 rounded-full border flex items-center justify-center cursor-pointer transition-all duration-200 ${
                liked
                  ? "bg-accent/15 border-accent text-accent"
                  : "bg-bg-card-hover border-border text-fg-secondary hover:text-accent hover:border-accent/40"
              }`}
              title="Like"
            >
              <svg
                className="w-5 h-5"
                fill={liked ? "currentColor" : "none"}
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

            {/* Favourite */}
            <button
              onClick={handleFavorite}
              className={`track-action-btn w-11 h-11 rounded-full border flex items-center justify-center cursor-pointer transition-all duration-200 ${
                favorited
                  ? "bg-yellow-500/15 border-yellow-500 text-yellow-400"
                  : "bg-bg-card-hover border-border text-fg-secondary hover:text-yellow-400 hover:border-yellow-400/40"
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
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
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
