import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./App.css";

import Navbar from "./components/Navbar";
import Carousel from "./components/Carousel";
import SearchBar from "./components/SearchBar";
import Categories from "./components/Categories";
import CallToAction from "./components/CallToAction";
import Footer from "./components/Footer";
import Placeholder from "./components/Placeholder";
import MusicPlayer from "./components/MusicPlayer";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import SupportPage from "./components/SupportPage";
import ProfilePage from "./components/ProfilePage";

gsap.registerPlugin(ScrollTrigger);

function LandingPage() {
  useEffect(() => {
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
          },
        }
      );
    });
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 space-y-16">
        <Carousel />
        <SearchBar />
        <Categories />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
function App() {


  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/player" element={<MusicPlayer />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/profile/:username?" element={<ProfilePage />} />
        <Route path="*" element={<Placeholder />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;