import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="hide-on-enter border-t border-white/10 bg-white/5 backdrop-blur-md text-white">
      <div className="section-margins py-14">
        <div className="grid grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img 
                src="/logo.svg" 
                alt="DART v6.1 Logo" 
                className="w-8 h-8 object-contain [filter:brightness(0)_invert(1)]" 
              />
              <span className="text-lg font-bold font-[var(--font-family-heading)] text-white">
                DART v6.1
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
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-5">
        <p className="text-center text-white/50 text-xs">
          © {new Date().getFullYear()} DART v6.1. All rights reserved. All
          music shared on this platform is copyright-free.
        </p>
      </div>
    </footer>
  );
}
