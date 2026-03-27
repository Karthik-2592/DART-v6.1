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
    window.scrollTo(0, 0);

    // Entrance animation classes
    document.body.classList.add("is-entering");
    document.body.classList.remove("has-entered");

    // Same scroll-driven brightness as LandingPage
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
            scrub: true,
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [song]);

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 space-y-10 content-margins">
        <Visualizer song={song} />
        <PlaylistQueue />
        <TrackDetails />
      </main>
      <DiscoverMore />
      <Footer />
    </>
  );
}
