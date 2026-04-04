import {  useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { gsap } from "gsap";
import { usePlayer } from "../context/PlayerContext";
import { API_URL } from "../constants/api";

import Navbar from "./Navbar";    
import Visualizer from "./Visualizer";
import PlaylistQueue from "./PlaylistQueue";
import TrackDetails from "./TrackDetails";
import DiscoverMore from "./DiscoverMore";
import Comments from "./Comments";
import Footer from "./Footer";


export default function MusicPlayer() {
  const { songId } = useParams();
  const location = useLocation();
  const { currentSong, setCurrentSong, setContextSongs, contextSongs, setIsMiniPlayerOpen, lastPlayedSongIdRef, audioRef } = usePlayer();

  useEffect(() => {
    setIsMiniPlayerOpen(false);
  }, [setIsMiniPlayerOpen]);

  useEffect(() => {
    // Sync context songs from state if provided (e.g. from a specific category or playlist)
    if (location.state?.contextSongs) {
      setContextSongs(location.state.contextSongs);
    }
    
    // If we have a song in state and it matches the URL ID, use it
    if (location.state?.song && String(location.state.song.id) === songId && currentSong?.id !== location.state.song.id) {
      setCurrentSong(location.state.song);
      return;
    }

    // Otherwise, if we have an ID in the URL and it doesn't match current, fetch it
    if (songId && String(currentSong?.id) !== songId) {
      fetch(`${API_URL}/songs/${songId}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setCurrentSong(data);
          }
        })
        .catch(err => console.error("Player fetch error:", err));
    }
  }, [songId, location.state, setContextSongs, setCurrentSong, currentSong?.id]);

  useEffect(() => {
    const isReturningSameSong = lastPlayedSongIdRef.current === Number(songId) && audioRef.current && audioRef.current.currentTime > 0;

    if (!isReturningSameSong) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      // Entrance animation classes
      document.body.classList.add("is-entering");
      document.body.classList.remove("has-entered");
    } else {
      document.body.classList.remove("is-entering");
      document.body.classList.add("has-entered");
    }

    // --- New: Fullscreen + Viewport Top Auto-Hide Logic ---
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    let isHidden = false;

    const nav = document.querySelector("nav");
    const queue = document.querySelector(".playlist-queue-container");

    const animateVisibility = (show: boolean) => {
      if (isHidden === !show) return;
      isHidden = !show;

      gsap.to([nav, queue], {
        opacity: show ? 1 : 0,
        duration: 0.5,
        ease: "power2.inOut",
        pointerEvents: show ? "auto" : "none",
      });
    };

    const checkConditions = () => {
      const isFullscreen = !!document.fullscreenElement;
      const isAtTop = window.scrollY < 10;

      if (isFullscreen && isAtTop) {
        if (!hideTimer && !isHidden) {
          hideTimer = setTimeout(() => {
            animateVisibility(false);
          }, 3000); // 3 seconds interval
          nav?.classList.remove("hide-on-enter")
        }
      } else {
        if (hideTimer) {
          clearTimeout(hideTimer);
          hideTimer = null;
        }
        animateVisibility(true);
      }
    };

    window.addEventListener("scroll", checkConditions);
    document.addEventListener("fullscreenchange", checkConditions);

    // Initial check
    checkConditions();

    return () => {
      window.removeEventListener("scroll", checkConditions);
      document.removeEventListener("fullscreenchange", checkConditions);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [currentSong]);

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 space-y-10 content-margins">
        <Visualizer song={currentSong} />
        <div className="playlist-queue-container">
          <PlaylistQueue contextSongs={contextSongs} />
        </div>
        <TrackDetails song={currentSong} />
      </main>
      <DiscoverMore />
      {currentSong && (
          <div className="content-margins pb-20">
            <Comments songId={currentSong.id} />
          </div>
      )}
      <Footer />
    </>
  );
}
