import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap } from "gsap";

export default function SupportPage() {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [messageErr, setMessageErr] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const stepContainerRef = useRef<HTMLDivElement>(null);
  // const [step] = useState<1>(1);

  /* GSAP Entrance Animation */
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }
      );
    }
  }, []);

  /* Check auth state */
  useEffect(() => {
    const raw = sessionStorage.getItem("soundshare_user");
    if (raw) {
      try {
        const user = JSON.parse(raw);
        setIsLoggedIn(true);
        setDisplayName(user.displayName || user.username || "User");
      } catch {
        /* corrupted data – treat as logged out */
      }
    }
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setMessageErr("Please enter a message before sending.");
      return;
    }
    if (message.length > 2000) {
      setMessageErr("Message is too long (max 2 000 characters).");
      return;
    }
    setMessageErr(null);

    /* Show success toast, then redirect */
    setShowToast(true);
    setTimeout(() => {
      navigate("/");
    }, 2200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-8 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-120px] left-[-100px] w-[400px] h-[400px] rounded-full bg-accent/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-80px] w-[350px] h-[350px] rounded-full bg-accent-light/10 blur-[100px] pointer-events-none" />

      {/* Toast */}
      <div
        className={`fixed top-8 left-1/2 -translate-x-1/2 bg-gradient-to-br from-accent to-accent-light text-white font-[var(--font-family-body)] font-semibold text-[0.95rem] px-8 py-3.5 rounded-[14px] shadow-[0_8px_40px_rgba(233,30,140,0.35)] z-[9999] pointer-events-none transition-all duration-400 ${showToast ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-5"}`}
      >
        ✓ Message sent successfully!
      </div>

      <div
        ref={cardRef}
        className="relative z-10 w-full max-w-[440px] bg-[#1a1a25]/70 backdrop-blur-[24px] border border-border rounded-[20px] p-10 transition-all duration-400 hover:border-accent/25 hover:shadow-[0_0_50px_rgba(233,30,140,0.06)]"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-9 h-9 rounded-[10px] bg-white/15 flex items-center justify-center text-white font-bold text-base font-[var(--font-family-heading)]">
            S
          </div>
          <span className="text-xl font-bold font-[var(--font-family-heading)] text-white">
            SoundShare
          </span>
        </div>

        <h1 className="text-center font-[var(--font-family-heading)] text-2xl font-bold text-fg-primary mt-3 mb-7">
          Support
        </h1>
      <div ref = {stepContainerRef}>
        {!isLoggedIn ? (
          /* ── Not logged in ── */
        
          <div className="text-center py-4">
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <p className="text-fg-secondary mb-6 text-[0.95rem] leading-[1.6]">
              You need to be logged in to send a support request. Please log in
              or create an account first.
            </p>
            <Link to="/login" className="no-underline">
              <button className="w-full p-[0.85rem] rounded-[12px] border-none cursor-pointer text-base font-semibold text-white bg-gradient-to-br from-accent to-accent-light transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(233,30,140,0.3)] active:translate-y-0">
                Go to Login
              </button>
            </Link>
          </div>
        ) : (
          /* ── Logged in ── */
          <form onSubmit={handleSend} noValidate>
            <p className="text-fg-secondary text-[0.9rem] mb-5 leading-[1.6]">
              Hi <strong className="text-fg-primary">{displayName}</strong>,
              how can we help? Describe your issue or question below and our
              team will get back to you.
            </p>

            <div className="mb-4 relative group">
              <label
                className="block text-[0.8rem] font-medium text-fg-secondary mb-1 transition-colors group-focus-within:text-accent-light"
                htmlFor="support-message"
              >
                Your Message
              </label>
              <textarea
                id="support-message"
                className={`w-full px-4 py-3 rounded-[10px] border-[1.5px] bg-bg-primary text-fg-primary text-[0.95rem] outline-none resize-y min-h-[100px] transition-all duration-300 placeholder:text-fg-muted hover:border-accent-dark focus:border-accent focus:bg-bg-secondary focus:shadow-[0_0_0_3px_rgba(233,30,140,0.12),0_0_20px_rgba(233,30,140,0.08)] ${messageErr ? "border-[#ff4466] shadow-[0_0_0_3px_rgba(255,68,102,0.12)]" : "border-border"}`}
                placeholder="Describe your issue or question…"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (messageErr && e.target.value.trim()) setMessageErr(null);
                }}
                rows={5}
              />
              <p
                className={`text-[0.75rem] text-[#ff4466] mt-1 min-h-[1rem] leading-[1.3] transition-all duration-250 ${messageErr ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}`}
              >
                {messageErr ?? "\u00A0"}
              </p>
            </div>

            <button
              type="submit"
              className="w-full p-[0.85rem] mt-2 rounded-[12px] border-none cursor-pointer text-base font-semibold text-white bg-gradient-to-br from-accent to-accent-light transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(233,30,140,0.3)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              disabled={showToast}
            >
              {showToast ? "Sending…" : "Send Message"}
            </button>
          </form>
        )}

        <div className="flex flex-col items-center mt-6">
          <Link
            to="/"
            className="text-accent no-underline font-medium transition-colors duration-200 hover:text-accent-light"
          >
            ← Back to Home
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
