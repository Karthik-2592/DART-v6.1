import { useState, useRef, useCallback, useEffect } from "react";
import { gsap } from "gsap";

interface PlaybackControlsProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  song?: any; // any to avoid complex imports here, or use existing Song
}

export default function PlaybackControls({ audioRef, song }: PlaybackControlsProps) {

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const [speed, setSpeed] = useState(100);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isHoveringPlayer, setIsHoveringPlayer] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const hasIncrementedRef = useRef(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const displayedTime = isDragging ? dragTime : currentTime;
  const progressPercent = duration > 0 ? (displayedTime / duration) * 100 : 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    // Initial load
    if (audio.readyState >= 1) {
      setDuration(audio.duration);
    }
    
    // Reset progress bar on load
    audio.currentTime = 0;

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, []);

  const incrementPlayCount = useCallback(() => {
    if (!song?.title || hasIncrementedRef.current) return;
    
    hasIncrementedRef.current = true;
    // 1. Global play count
    fetch(`http://localhost:5000/songs/play?title=${encodeURIComponent(song.title)}`, { method: "POST" })
      .catch(err => console.error("Failed to increment global play count:", err));

    // 2. User-specific play count (if logged in)
    const saved = sessionStorage.getItem("soundshare_user");
    if (saved) {
      try {
        const user = JSON.parse(saved);
        if (user.username) {
          fetch(`http://localhost:5000/favorites/play?username=${encodeURIComponent(user.username)}&title=${encodeURIComponent(song.title)}`, { method: "POST" })
            .catch(err => console.error("Failed to increment user play count:", err));
        }
      } catch (e) { console.error("Error parsing user for play tracking:", e); }
    }
  }, [song]);

  // Entrance Animation & Autoplay on song change
  useEffect(() => {
    if (!progressBarRef.current) return;
    
    setIsEntering(true);
    hasIncrementedRef.current = false;
    
    gsap.fromTo(
      progressBarRef.current,
      { width: "0%" },
      {
        width: "100%",
        duration: 1.2,
        ease: "power2.inOut",
        onComplete: () => {
          document.body.classList.remove("is-entering");
          document.body.classList.add("has-entered");
          setIsEntering(false);
          const audio = audioRef.current;
          if (audio) {
            // Autoplay on load
            audio.currentTime = 0;
            audio.play()
              .then(() => incrementPlayCount())
              .catch(e => console.log("Autoplay prevented:", e));
          }
        },
      }
    );
  }, [song, audioRef, incrementPlayCount]);

  // Close settings when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node)
      ) {
        setSettingsOpen(false);
      }
    };
    if (settingsOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [settingsOpen]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().then(() => {
        incrementPlayCount();
      }).catch(e => console.log("Play failed:", e));
    }
  }, [isPlaying, incrementPlayCount]);

  const handleRewind = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  }, []);

  const handleFastForward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.duration || 0,
        audioRef.current.currentTime + 10
      );
    }
  }, []);

  const calculateTimeFromX = useCallback((clientX: number) => {
    const bar = progressBarRef.current?.parentElement;
    if (!bar || duration === 0) return 0;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * duration;
  }, [duration]);

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const newTime = calculateTimeFromX(e.clientX);
    setDragTime(newTime);
  };

  useEffect(() => {
    if (!isDragging) return;
    
    const onMouseMove = (e: MouseEvent) => {
      const newTime = calculateTimeFromX(e.clientX);
      setDragTime(newTime);
    };

    const onMouseUp = (e: MouseEvent) => {
      const finalTime = calculateTimeFromX(e.clientX);
      if (audioRef.current) {
        audioRef.current.currentTime = finalTime;
      }
      setIsDragging(false);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, calculateTimeFromX, audioRef]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed / 100;
    }
  }, [speed]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  return (
    <section
      className="w-full"
      onMouseEnter={() => setIsHoveringPlayer(true)}
      onMouseLeave={() => setIsHoveringPlayer(false)}
    >


      <div className="w-full">
        {/* ── Progress bar ── */}
        <div className="flex items-center gap-3 mb-5">
          <span className="hide-on-enter text-xs text-fg-muted font-medium w-10 text-left tabular-nums">
            {formatTime(displayedTime)}
          </span>
          <div
            className="flex-1 cursor-pointer group h-8 flex items-center justify-center"
            onMouseDown={onMouseDown}
          >
            <div
              className={`w-full bg-border rounded-full relative transition-transform duration-200 h-[3px] origin-bottom ${
                isHoveringPlayer || isDragging ? "translate-y-0.25 scale-y-150" : "scale-y-100"
              }`}
            >
              <div
                ref={progressBarRef}
                className="absolute top-0 left-0 h-full bg-accent rounded-full transition-all duration-200 min-w-[6px]"
                style={{ width: isEntering ? "0%" : `${progressPercent}%` }}
              />
              <div
                className={`hide-on-enter absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-accent rounded-full shadow-lg transition-all duration-200 ${
                  isHoveringPlayer || isDragging ? "scale-x-150 opacity-100" : "opacity-0"
                }`}
                style={{ left: `${progressPercent}%`, marginLeft: "-6px" }}
              />
            </div>
          </div>
          <span className="hide-on-enter text-xs text-fg-muted font-medium w-10 tabular-nums">
            -{formatTime(duration - displayedTime)}
          </span>
        </div>

        {/* ── Controls row ── */}
        <div className="flex items-center justify-between">
          {/* Left controls - Fullscreen Toggle */}
          <div className="flex-1 hide-on-enter flex items-center justify-start">
            <button
              onClick={toggleFullscreen}
              className="player-btn w-10 h-10 rounded-full bg-bg-card-hover border border-border flex items-center justify-center cursor-pointer group hover:border-accent/50 transition-all duration-300"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <svg className="w-4 h-4 text-fg-secondary group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0l0 5m0-5l5 0M15 9l5-5m0 0l-5 0m5 0l0 5M9 15l-5 5m0 0l5 0m-5 0l0-5M15 15l5 5m0 0l0-5m0 5l-5 0" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-fg-secondary group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5M20 8V4m0 0h-4M20 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          </div>

          {/* Center controls */}
          <div className="flex items-center gap-5">
            {/* Rewind */}
            <button
              onClick={handleRewind}
              className="hide-on-enter player-btn w-10 h-10 rounded-full bg-transparent border border-border flex items-center justify-center cursor-pointer"
              title="Rewind 10s"
            >
              <svg
                className="w-4 h-4 text-fg-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
                />
              </svg>
            </button>

            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              className="player-btn w-14 h-14 rounded-full bg-accent flex items-center justify-center cursor-pointer border-none shadow-lg shadow-accent/20"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-white ml-0.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Fast Forward */}
            <button
              onClick={handleFastForward}
              className="hide-on-enter player-btn w-10 h-10 rounded-full bg-bg-card-hover border border-border flex items-center justify-center cursor-pointer"
              title="Forward 10s"
            >
              <svg
                className="w-4 h-4 text-fg-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
                />
              </svg>
            </button>
          </div>

          {/* Right controls */}
          <div className="hide-on-enter flex-1 flex items-center justify-end gap-4">
            {/* Volume */}
            <div className="flex items-center gap-2">
              {volume === 0 ? (
                <svg
                  className="w-4 h-4 text-fg-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : volume < 50 ? (
                <svg
                  className="w-4 h-4 text-fg-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072" />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-fg-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072v0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728v0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="volume-slider w-20"
                style={{
                  background: `linear-gradient(to right, var(--color-accent) ${volume}%, var(--color-border) ${volume}%)`,
                }}
              />
            </div>

            {/* Settings */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen((o) => !o)}
                className="player-btn w-9 h-9 rounded-full bg-bg-card-hover border border-border flex items-center justify-center cursor-pointer"
                title="Settings"
              >
                <svg
                  className="w-4 h-4 text-fg-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>

              {settingsOpen && (
                <div className="absolute bottom-full right-0 mb-4 w-64 bg-bg-card border border-border rounded-xl p-5 shadow-2xl z-50">
                  <h4 className="text-sm font-semibold text-fg-primary font-[var(--font-family-heading)] mb-4">
                    Audio Preferences
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-fg-muted block mb-1.5">
                        Playback Speed
                      </label>
                      <input
                        type="range"
                        min={50}
                        max={200}
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                        className="volume-slider w-full"
                      />
                      <div className="flex justify-between text-[10px] text-fg-muted mt-1">
                        <span>0.5×</span>
                        <span>1.0×</span>
                        <span>2.0×</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-fg-muted block mb-1.5">
                        Pitch
                      </label>
                      <input
                        type="range"
                        min={-12}
                        max={12}
                        defaultValue={0}
                        className="volume-slider w-full"
                      />
                      <div className="flex justify-between text-[10px] text-fg-muted mt-1">
                        <span>−12</span>
                        <span>0</span>
                        <span>+12</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-fg-muted block mb-1.5">
                        Equalizer
                      </label>
                      <div className="text-xs text-fg-muted/50 italic">
                        Coming soon…
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
