import { useState, type FormEvent, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap } from "gsap";

/* ── Validation helpers ── */
function validateUsername(v: string): string | null {
  if (v.length < 4) return "Username must be at least 4 characters.";
  if (v.length > 32) return "Username must be 32 characters or fewer.";
  if (!/^[a-zA-Z0-9_]+$/.test(v))
    return "Only letters, numbers and underscores are allowed.";
  return null;
}

function validatePassword(v: string): string | null {
  if (v.length < 8) return "Password must be at least 8 characters.";
  if (v.length > 128) return "Password is too long.";
  if (/\s/.test(v)) return "Password must not contain whitespace.";
  return null;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [usernameErr, setUsernameErr] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);

  /* live validation on blur */
  const blurUsername = () => setUsernameErr(validateUsername(username));
  const blurPassword = () => setPasswordErr(validatePassword(password));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalErr, setGlobalErr] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const uErr = validateUsername(username);
    const pErr = validatePassword(password);
    setUsernameErr(uErr);
    setPasswordErr(pErr);
    setGlobalErr(null);

    if (uErr || pErr) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:5000/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Trigger shaker for both fields if login fails
        setUsernameErr(data.error || "Login failed");
        setPasswordErr(data.error || "Login failed");
        return;
      }

      /* Store result in sessionStorage */
      sessionStorage.setItem("soundshare_user", JSON.stringify(data));
      navigate("/");
    } catch (err) {
      console.error(err);
      setGlobalErr("Connection error. Is the server running?");
    } finally {
      setIsSubmitting(false);
    }
  };

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
  const [step] = useState<1>(1);
  const stepContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (stepContainerRef.current) {
      gsap.fromTo(
        stepContainerRef.current,
        { opacity: 0, x: step === 1 ? 30 : -30 },
        { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [step]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-8 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-120px] left-[-100px] w-[400px] h-[400px] rounded-full bg-accent/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-80px] w-[350px] h-[350px] rounded-full bg-accent-light/10 blur-[100px] pointer-events-none" />

      <div
        ref={cardRef}
        className="relative z-10 w-full max-w-[440px] bg-[#1a1a25]/70 backdrop-blur-[24px] border border-border rounded-[20px] p-10 pt-10 pb-8 transition-all duration-400 hover:border-accent/25 hover:shadow-[0_0_50px_rgba(233,30,140,0.06)]"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <img 
            src="/logo.svg" 
            alt="SoundShare Logo" 
            className="w-9 h-9 object-contain [filter:brightness(0)_invert(1)]" 
          />
          <span className="text-xl font-bold font-[var(--font-family-heading)] text-white">
            SoundShare
          </span>
        </div>

        <h1 className="text-center font-[var(--font-family-heading)] text-2xl font-bold text-fg-primary mt-3 mb-7">
          Log In
        </h1>
      <div ref = {stepContainerRef}>
        <form onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div className="mb-5 relative group">
            <label
              className="block text-[0.8rem] font-medium text-fg-secondary mb-1.5 transition-colors group-focus-within:text-accent-light"
              htmlFor="login-username"
            >
              Username
            </label>
            <input
              id="login-username"
              className={`w-full px-4 py-3 rounded-[10px] border-[1.5px] bg-bg-primary text-fg-primary text-[0.95rem] outline-none transition-all duration-300 placeholder:text-fg-muted hover:border-accent-dark focus:border-accent focus:bg-bg-secondary focus:shadow-[0_0_0_3px_rgba(233,30,140,0.12),0_0_20px_rgba(233,30,140,0.08)] ${usernameErr ? "border-[#ff4466] shadow-[0_0_0_3px_rgba(255,68,102,0.12)] animate-[authShake_0.35s_ease]" : "border-border"}`}
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (usernameErr) setUsernameErr(validateUsername(e.target.value));
              }}
              onBlur={blurUsername}
              autoComplete="username"
            />
            <p
              className={`text-[0.75rem] text-[#ff4466] mt-1.5 min-h-[1rem] leading-[1.3] transition-all duration-250 ${usernameErr ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}`}
            >
              {usernameErr ?? "\u00A0"}
            </p>
          </div>

          {/* Password */}
          <div className="mb-5 relative group">
            <label
              className="block text-[0.8rem] font-medium text-fg-secondary mb-1.5 transition-colors group-focus-within:text-accent-light"
              htmlFor="login-password"
            >
              Password
            </label>
            <input
              id="login-password"
              className={`w-full px-4 py-3 rounded-[10px] border-[1.5px] bg-bg-primary text-fg-primary text-[0.95rem] outline-none transition-all duration-300 placeholder:text-fg-muted hover:border-accent-dark focus:border-accent focus:bg-bg-secondary focus:shadow-[0_0_0_3px_rgba(233,30,140,0.12),0_0_20px_rgba(233,30,140,0.08)] ${passwordErr ? "border-[#ff4466] shadow-[0_0_0_3px_rgba(255,68,102,0.12)] animate-[authShake_0.35s_ease]" : "border-border"}`}
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordErr) setPasswordErr(validatePassword(e.target.value));
              }}
              onBlur={blurPassword}
              autoComplete="current-password"
            />
            <p
              className={`text-[0.75rem] text-[#ff4466] mt-1.5 min-h-[1rem] leading-[1.3] transition-all duration-250 ${passwordErr ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}`}
            >
              {passwordErr ?? "\u00A0"}
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full p-[0.85rem] mt-2 rounded-[12px] border-none cursor-pointer text-base font-semibold text-white bg-gradient-to-br from-accent to-accent-light transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(233,30,140,0.3)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            {isSubmitting ? "Logging In..." : "Log In"}
          </button>
          
          {globalErr && (
            <p className="text-center text-[#ff4466] text-xs mt-3 animate-in fade-in duration-300">{globalErr}</p>
          )}
        </form>
      </div>
        <div className="flex flex-col items-center gap-2 mt-6 text-[0.85rem] text-fg-muted">
          <span>
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-accent no-underline font-medium transition-colors duration-200 hover:text-accent-light"
            >
              Sign Up
            </Link>
          </span>
          <span>
            Can't sign in?{" "}
            <Link
              to="/support"
              className="text-accent no-underline font-medium transition-colors duration-200 hover:text-accent-light"
            >
              Contact Support
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
