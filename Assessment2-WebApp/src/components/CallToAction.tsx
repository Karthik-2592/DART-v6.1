import { Link } from "react-router-dom";

export default function CallToAction() {
  return (
    <section className="content-margins py-20 scroll-section">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-bg-secondary via-bg-card to-bg-secondary border border-border p-16 text-center">
        {/* Decorative glow blobs */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-accent/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-accent-light/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <h2 className="text-4xl font-bold font-[var(--font-family-heading)] text-fg-primary mb-4">
            Unlock the Full Experience
          </h2>
          <p className="text-fg-secondary text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Sign up to upload your own tracks, create playlists, follow artists,
            and enjoy unlimited access to copyright-free music.
          </p>

          <Link to="/signup" className="no-underline">
            <button className="btn-accent text-lg px-10 py-4">
              Get Started — It's Free
            </button>
          </Link>

          <p className="mt-6 text-fg-muted text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-accent hover:text-accent-light transition-colors no-underline font-medium"
            >
              Log In
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
