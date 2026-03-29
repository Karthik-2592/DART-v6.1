import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import gsap from "gsap";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useState<{ username: string; displayName: string; profile_picture?: string } | null>(() => {
    const saved = sessionStorage.getItem("dart_v6_1_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    if (isMenuOpen) {
      setIsClosing(true);
      if (menuRef.current) {
        gsap.to(menuRef.current, {
          opacity: 0,
          y: -10,
          scale: 0.95,
          duration: 0.2,
          ease: "power2.in",
          onComplete: () => {
            setIsMenuOpen(false);
            setIsClosing(false);
          }
        });
      }
    } else {
      setIsMenuOpen(true);
    }
  };

  useEffect(() => {
    if (isMenuOpen && !isClosing && menuRef.current) {
      gsap.fromTo(menuRef.current,
        { opacity: 0, y: -10, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(1.7)" }
      );
    }
  }, [isMenuOpen, isClosing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isMenuOpen) toggleMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  return (
    <nav className="hide-on-enter fixed top-0 left-0 w-full z-50 flex items-center justify-between px-12 py-1 bg-white/5 backdrop-blur-md border-b border-white/10">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 no-underline group">
        <img 
          src="/logo.svg" 
          alt="DART v6.1 Logo" 
          className="w-10 h-10 object-contain transition-all group-hover:scale-110 [filter:brightness(0)_invert(1)]"
        />
        <span className="text-xl font-bold font-[var(--font-family-heading)] text-white group-hover:text-accent-light transition-colors">
          DART v6.1
        </span>
      </Link>

      {/* Right side links */}
      <div className="flex items-center gap-8">
        <Link to="/" 
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-white/80 hover:text-white transition-colors text-sm font-medium no-underline">
          Home
        </Link>
        <button
          onClick={() => {
            if (location.pathname === "/") {
              document.getElementById("search-section")?.scrollIntoView({ behavior: "smooth" });
            } else {
              navigate("/#search-section");
            }
          }}
          className="text-white/80 hover:text-white transition-colors text-sm font-medium border-none bg-transparent cursor-pointer"
        >
          Search
        </button>

        {/* Profile / Login */}
        <div className="relative" ref={dropdownRef}>
          {user ? (
            <button
              onClick={toggleMenu}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-accent-light p-0.5 shadow-lg active:scale-90 transition-transform cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-accent to-accent-light flex items-center justify-center text-white border-2 border-white/20 shadow-lg overflow-hidden">
                <img 
                  src={user.profile_picture ? `http://localhost:5000/profilePic/${user.profile_picture}` : `https://ui-avatars.com/api/?name=${user.username}&background=E91E8C&color=fff&size=128`} 
                  alt="avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </button>
          ) : (
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
          )}

          {(isMenuOpen || isClosing) && user && (
            <div
              ref={menuRef}
              className="absolute top-14 right-0 w-64 bg-[#1a1a25]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-3xl py-2 overflow-hidden z-50 flex flex-col"
            >
              <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                <p className="text-xs font-bold text-accent uppercase tracking-widest mb-0.5">Signed in as</p>
                <p className="text-sm font-bold text-white truncate">{user.displayName}</p>
              </div>
              
              <Link
                to="/profile"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 text-sm text-white/80 hover:text-accent hover:bg-white/5 no-underline transition-all flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Profile</span>
                </div>
              </Link>

              <button
                onClick={() => {
                  sessionStorage.removeItem("dart_v6_1_user");
                  window.location.href = "/";
                }}
                className="px-4 py-3 text-sm text-white/80 hover:text-red-400 hover:bg-red-400/5 no-underline transition-all flex items-center gap-3 group border-none bg-transparent cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-red-400/10 flex items-center justify-center text-red-400 group-hover:bg-red-400 group-hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </div>
                <span className="text-sm font-medium text-left">Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
