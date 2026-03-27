import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="hide-on-enter fixed top-0 left-0 w-full z-50 flex items-center justify-between px-12 py-1 bg-white/5 backdrop-blur-md border-b border-white/10">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 no-underline">
        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-lg font-[var(--font-family-heading)]">
          S
        </div>
        <span className="text-xl font-bold font-[var(--font-family-heading)] text-white">
          SoundShare
        </span>
      </Link>

      {/* Right side links */}
      <div className="flex items-center gap-8">
        <Link to="/" className="text-white/80 hover:text-white transition-colors text-sm font-medium no-underline">
          Home
        </Link>
        <Link
          to="/search"
          className="text-white/80 hover:text-white transition-colors text-sm font-medium no-underline"
        >
          Search
        </Link>

        {/* Login button / profile picture */}
        <Link
          to="/login"
          className="flex items-center gap-2 no-underline bg-white/10 hover:bg-white/20 border border-white/10 rounded-full pl-4 pr-2 py-1.5 transition-all duration-300"
        >
          <span className="text-sm text-white font-medium">Log In</span>
          <div className="w-8 h-8 rounded-full bg-white/20 border border-white/20 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </Link>
      </div>
    </nav>
  );
}
