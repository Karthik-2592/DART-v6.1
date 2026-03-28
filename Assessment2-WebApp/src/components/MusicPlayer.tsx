import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type Song } from "./Categories";

import Navbar from "./Navbar";
import Visualizer from "./Visualizer";
import PlaylistQueue from "./PlaylistQueue";
import TrackDetails from "./TrackDetails";
import DiscoverMore from "./DiscoverMore";
import Footer from "./Footer";

gsap.registerPlugin(ScrollTrigger);

export default function MusicPlayer() {
  const location = useLocation();
  const song = location.state?.song as Song | undefined;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Entrance animation classes
    document.body.classList.add("is-entering");
    document.body.classList.remove("has-entered");

    // Existing scroll-driven brightness animations
    const sections = document.querySelectorAll(".scroll-section");

    sections.forEach((section) => {
      gsap.fromTo(
        section,
        { opacity: 0.55, filter: "brightness(0.8)" },
        {
          opacity: 1,
          filter: "brightness(1.05)",
          duration: "0.1",
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            end: "bottom 15%",
            scrub: 1,
          },
        }
      );
    });

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
      ScrollTrigger.getAll().forEach((t) => t.kill());
      window.removeEventListener("scroll", checkConditions);
      document.removeEventListener("fullscreenchange", checkConditions);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [song]);

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 space-y-10 content-margins">
        <Visualizer song={song} />
        <div className="playlist-queue-container">
          <PlaylistQueue />
        </div>
        <TrackDetails song={song} />
      </main>
      <DiscoverMore />
      <Footer />
    </>
  );
}
