import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./App.css";

import { usePlayer } from "./context/PlayerContext";

import { API_URL } from "./constants/api";
import Navbar from "./components/Navbar";
import Carousel from "./components/Carousel";
import SearchBar from "./components/SearchBar";
import Categories from "./components/Categories";
import CallToAction from "./components/CallToAction";
import Footer from "./components/Footer";
import AboutUs from "./components/AboutUs";
import MusicPlayer from "./components/MusicPlayer";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import SupportPage from "./components/SupportPage";
import ProfilePage from "./components/ProfilePage";
import MiniPlayer from "./components/MiniPlayer";

gsap.registerPlugin(ScrollTrigger);

function LandingPage() {
  const { allSongs } = usePlayer();
  const songs = allSongs || [];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const initScrollTriggers = () => {
        const sections = document.querySelectorAll(".scroll-section");
        sections.forEach((section) => {
          gsap.fromTo(
            section,
            { opacity: 0.85, filter: "brightness(0.9)" },
            {
              opacity: 1,
              filter: "brightness(1.15)",
              duration: "0.1",
              scrollTrigger: {
                trigger: section,
                start: "top 85%",
                end: "bottom 15%",
                scrub: 1,
                invalidateOnRefresh: true,
              },
            }
          );
        });
      };

      initScrollTriggers();

      // Refresh ScrollTrigger after a short delay to account for data-driven component mounting
      const timer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 500);

      return () => clearTimeout(timer);
    });

    return () => ctx.revert();
  }, [songs]); // Refresh triggers when songs are loaded

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 space-y-16">
        <Carousel songs={songs} />
        <SearchBar />
        <Categories songs={songs} />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}

function App() {
  const { setAllSongs, allSongs } = usePlayer();

  useEffect(() => {
    // Only fetch if songs are not already loaded in the library
    if (!allSongs || allSongs.length === 0) {
      fetch(`${API_URL}/songs`)
        .then(res => res.json())
        .then(data => setAllSongs(data || []))
        .catch(err => console.error("App fetch error:", err));
    }
  }, [setAllSongs, allSongs]);

  return (
    <BrowserRouter>
      <MiniPlayer />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/player/:songId?" element={<MusicPlayer />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/profile/:username?" element={<ProfilePage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;