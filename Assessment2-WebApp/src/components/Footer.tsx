import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="hide-on-enter border-t border-white/10 bg-white/5 backdrop-blur-md text-white">
      <div className="section-margins py-14">
        <div className="grid grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-sm font-[var(--font-family-heading)]">
                S
              </div>
              <span className="text-lg font-bold font-[var(--font-family-heading)] text-white">
                SoundShare
              </span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Share and discover copyright-free music from creators around the
              world.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-[var(--font-family-heading)] font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="list-none space-y-2.5">
              <li>
                <Link
                  to="/"
                  className="text-white/70 hover:text-white text-sm no-underline transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/search"
                  className="text-white/70 hover:text-white text-sm no-underline transition-colors"
                >
                  Search
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-white/70 hover:text-white text-sm no-underline transition-colors"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-[var(--font-family-heading)] font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Contact
            </h4>
            <ul className="list-none space-y-2.5 text-white/70 text-sm">
              <li>hello@soundshare.io</li>
              <li>+1 (555) 123-4567</li>
              <li>San Francisco, CA</li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-[var(--font-family-heading)] font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Follow Us
            </h4>
            <div className="flex gap-3">
              {/* YouTube */}
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 hover:border-white/30 hover:bg-white/20 flex items-center justify-center transition-all duration-300 group"
              >
                <svg
                  className="w-4 h-4 text-white/70 group-hover:text-white transition-colors"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              {/* Twitter / X */}
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 hover:border-white/30 hover:bg-white/20 flex items-center justify-center transition-all duration-300 group"
              >
                <svg
                  className="w-4 h-4 text-white/70 group-hover:text-white transition-colors"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* Instagram */}
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 hover:border-white/30 hover:bg-white/20 flex items-center justify-center transition-all duration-300 group"
              >
                <svg
                  className="w-4 h-4 text-white/70 group-hover:text-white transition-colors"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                </svg>
              </a>
              {/* Spotify */}
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 hover:border-white/30 hover:bg-white/20 flex items-center justify-center transition-all duration-300 group"
              >
                <svg
                  className="w-4 h-4 text-white/70 group-hover:text-white transition-colors"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-5">
        <p className="text-center text-white/50 text-xs">
          © {new Date().getFullYear()} SoundShare. All rights reserved. All
          music shared on this platform is copyright-free.
        </p>
      </div>
    </footer>
  );
}
