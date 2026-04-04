import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

function LandingPage() {
  const { allSongs } = usePlayer();
  const songs = allSongs || [];


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