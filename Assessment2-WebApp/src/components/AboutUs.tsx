import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Logo from "./Logo";

export default function AboutUs() {
  return (
    <>
      <Navbar />
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-bg-primary text-center px-6 pt-32 pb-20 content-margins">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent/20 to-accent-dark/20 border border-accent/20 flex items-center justify-center mb-8 shadow-lg shadow-accent/10 transition-transform duration-500 hover:scale-105">
          <Logo
            className="w-12 h-12 text-accent opacity-80"
          />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold font-[var(--font-family-heading)] text-fg-primary mb-8 tracking-tight">
          About DART v6.1
        </h1>

        <div className="max-w-2xl text-fg-secondary text-base leading-relaxed space-y-6 text-left p-8 bg-bg-card border border-border rounded-2xl shadow-xl">
          <p>
            Welcome to <strong className="text-accent font-semibold">DART v6.1</strong>, the ultimate platform for discovering and sharing copyright-free music. Whether you're a content creator looking for the perfect background track, or a music lover hunting for fresh sounds, you've come to the right place.
          </p>
          <p>
            Our mission is to bridge the gap between talented independent artists and storytellers. By providing an open, community-driven ecosystem, we ensure that great music finds its audience without the hassle of copyright strikes or licensing fees.
          </p>
          <p>
            We believe that music is meant to be shared freely. Every track on DART v6.1 is uploaded directly by the artists or curators under open licenses, allowing you to focus on what you do best: creating.
          </p>
        </div>

        <div className="mt-12 space-y-4">
          <Link to="/" className="no-underline inline-block">
            <button className="px-8 py-3.5 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-all duration-300 shadow-md hover:shadow-accent/40 hover:-translate-y-0.5">
              Start Exploring
            </button>
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
