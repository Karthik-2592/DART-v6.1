import { useNavigate, useLocation } from "react-router-dom";
import Draggable from "react-draggable";
import { usePlayer } from "../context/PlayerContext";
import { useEffect, useState, useRef } from "react";

export default function MiniPlayer() {
  const nodeRef = useRef<HTMLDivElement>(null);
  const { currentSong, audioRef, isMiniPlayerOpen, setIsMiniPlayerOpen, wasPoppedOutByUser, setWasPoppedOutByUser } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const [localIsPlaying, setLocalIsPlaying] = useState(false);

  // Auto-manage Mini-Player visibility based on playback and route
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    const isPlayerPage = location.pathname.startsWith("/player");

    if (isPlayerPage) {
       // MusicPlayer.tsx handles closing it
       return;
    }

    const checkVisibility = () => {
      // 1. If song is playing, mini player MUST be open (outside MusicPlayer)
      if (!audio.paused) {
        if (!isMiniPlayerOpen) setIsMiniPlayerOpen(true);
      } 
      // 2. If song is paused, only display if it was explicitly opened by user
      else if (!wasPoppedOutByUser) {
        if (isMiniPlayerOpen) setIsMiniPlayerOpen(false);
      }
    };

    checkVisibility();
    audio.addEventListener("play", checkVisibility);
    audio.addEventListener("pause", checkVisibility);
    return () => {
      audio.removeEventListener("play", checkVisibility);
      audio.removeEventListener("pause", checkVisibility);
    };
  }, [location.pathname, currentSong, audioRef, wasPoppedOutByUser, isMiniPlayerOpen, setIsMiniPlayerOpen]);

  // Sync internal playing state with global audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updatePlayState = () => setLocalIsPlaying(!audio.paused);
    updatePlayState(); // Initial sync

    audio.addEventListener("play", updatePlayState);
    audio.addEventListener("pause", updatePlayState);
    return () => {
      audio.removeEventListener("play", updatePlayState);
      audio.removeEventListener("pause", updatePlayState);
    };
  }, [audioRef]);


  if (!isMiniPlayerOpen || !currentSong) return null;

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag triggered
    const audio = audioRef.current;
    if (!audio) return;

    if (localIsPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMiniPlayerOpen(false);
    setWasPoppedOutByUser(false);
    navigate(`/player/${currentSong.id}`);
  };


  return (
    <Draggable cancel=".no-drag" nodeRef={nodeRef}>
      <div
        ref={nodeRef}
        className="fixed bottom-10 right-10 z-[100] w-48 h-48 rounded-2xl shadow-2xl overflow-hidden cursor-move group border border-border/50 bg-bg-card will-change-transform"
      >
        {/* Cover Image */}
        {currentSong.cover_path ? (
          <img
            src={`http://localhost:5000/images/${currentSong.cover_path}`}
            alt={currentSong.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-bg-card-hover text-accent/30">
            <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Controls Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">

          {/* Top Row: Close Button */}
          <div className="flex justify-end w-full">
            <button
              onClick={handleClose}
              className="no-drag w-8 h-8 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-white transition-colors cursor-pointer"
              title="Return to Main Player"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          </div>

          {/* Bottom Row: Track Info & Play */}
          <div className="flex items-end justify-between w-full">
            <div className="flex flex-col truncate pr-2">
              <span className="text-white font-bold text-sm truncate font-[var(--font-family-heading)] drop-shadow-md">
                {currentSong.title}
              </span>
              <span className="text-white/80 text-xs truncate font-[var(--font-family-body)]">
                {currentSong.artists}
              </span>
            </div>

            <button
              onClick={togglePlay}
              className="no-drag w-10 h-10 shrink-0 rounded-full bg-accent hover:bg-accent-hover flex items-center justify-center text-white shadow-lg cursor-pointer transition-transform hover:scale-105"
            >
              {localIsPlaying ? (
                <svg className="w-5 h-5 flex items-center justify-center" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>

        </div>
      </div>
    </Draggable>
  );
}
