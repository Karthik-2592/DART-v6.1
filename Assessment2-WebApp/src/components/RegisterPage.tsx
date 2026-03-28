import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap } from "gsap";

/* ── Validators ── */
function validateUsername(v: string): string | null {
  if (v.length < 4) return "Username must be at least 4 characters.";
  if (v.length > 32) return "Username must be 32 characters or fewer.";
  if (!/^[a-zA-Z0-9_]+$/.test(v))
    return "Only letters, numbers and underscores are allowed.";
  return null;
}

function validateEmail(v: string): string | null {
  if (!v) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
    return "Please enter a valid email address.";
  return null;
}

function validatePassword(v: string): string | null {
  if (v.length < 8) return "Password must be at least 8 characters.";
  if (v.length > 128) return "Password is too long.";
  if (/\s/.test(v)) return "Password must not contain whitespace.";
  return null;
}

function validateConfirm(pw: string, confirm: string): string | null {
  if (!confirm) return "Please confirm your password.";
  if (pw !== confirm) return "Passwords do not match.";
  return null;
}

function validateDisplayName(v: string): string | null {
  if (v.length < 2) return "Display name must be at least 2 characters.";
  if (v.length > 50) return "Display name must be 50 characters or fewer.";
  return null;
}

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/* Default avatar SVG as data-uri */
const DEFAULT_AVATAR =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="#1a1a25"/><circle cx="40" cy="30" r="14" fill="#6a6a80"/><ellipse cx="40" cy="68" rx="24" ry="18" fill="#6a6a80"/></svg>'
  );

export default function RegisterPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  /* ── Step 1 fields ── */
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [usernameErr, setUsernameErr] = useState<string | null>(null);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);
  const [confirmErr, setConfirmErr] = useState<string | null>(null);

  /* ── Step 2 fields ── */
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState<string>(DEFAULT_AVATAR);
  const [description, setDescription] = useState("");

  const [displayNameErr, setDisplayNameErr] = useState<string | null>(null);
  const [avatarErr, setAvatarErr] = useState<string | null>(null);

  /* ── Step management ── */
  const [step, setStep] = useState<1 | 2>(1);
  const stepContainerRef = useRef<HTMLDivElement>(null);

  /* ── Mount Animation ── */
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }
      );
    }
  }, []);

  /* ── Step Transition Animation ── */
  useEffect(() => {
    if (stepContainerRef.current) {
      gsap.fromTo(
        stepContainerRef.current,
        { opacity: 0, x: step === 2 ? 30 : -30 },
        { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [step]);

  /* ── Step 1 submit ── */
  const handleStep1 = (e: FormEvent) => {
    e.preventDefault();
    const uErr = validateUsername(username);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const cErr = validateConfirm(password, confirm);
    setUsernameErr(uErr);
    setEmailErr(eErr);
    setPasswordErr(pErr);
    setConfirmErr(cErr);
    if (uErr || eErr || pErr || cErr) return;
    setStep(2);
  };

  /* ── Avatar picker ── */
  const handleAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setAvatarErr("Please upload a JPEG, PNG, GIF or WebP image.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarErr("Image must be under 2 MB.");
      return;
    }
    setAvatarErr(null);
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  /* ── Step 2 submit ── */
  const handleStep2 = (e: FormEvent) => {
    e.preventDefault();
    const dErr = validateDisplayName(displayName);
    setDisplayNameErr(dErr);
    if (dErr || avatarErr) return;
    if (description.length > 300) return;

    /* Simulated registration */
    sessionStorage.setItem(
      "soundshare_user",
      JSON.stringify({
        username,
        email,
        displayName,
        avatar: avatar !== DEFAULT_AVATAR ? avatar : null,
        description,
      })
    );
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-8 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-120px] left-[-100px] w-[400px] h-[400px] rounded-full bg-accent/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-80px] w-[350px] h-[350px] rounded-full bg-accent-light/10 blur-[100px] pointer-events-none" />

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
          Create Account
        </h1>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-6">
          <div
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step === 1 ? "bg-accent scale-125 shadow-[0_0_8px_rgba(233,30,140,0.4)]" : "bg-accent-dark"}`}
          />
          <div
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step === 2 ? "bg-accent scale-125 shadow-[0_0_8px_rgba(233,30,140,0.4)]" : "bg-border"}`}
          />
        </div>

        <div ref={stepContainerRef}>
          {/* ═══════════ Step 1 ═══════════ */}
          {step === 1 && (
            <form onSubmit={handleStep1} noValidate key="step1">
              {/* Username */}
              <div className="mb-4 relative group">
                <label
                  className="block text-[0.8rem] font-medium text-fg-secondary mb-1 transition-colors group-focus-within:text-accent-light"
                  htmlFor="reg-username"
                >
                  Username
                </label>
                <input
                  id="reg-username"
                  className={`w-full px-4 py-3 rounded-[10px] border-[1.5px] bg-bg-primary text-fg-primary text-[0.95rem] outline-none transition-all duration-300 placeholder:text-fg-muted hover:border-accent-dark focus:border-accent focus:bg-bg-secondary focus:shadow-[0_0_0_3px_rgba(233,30,140,0.12),0_0_20px_rgba(233,30,140,0.08)] ${usernameErr ? "border-[#ff4466] shadow-[0_0_0_3px_rgba(255,68,102,0.12)] animate-[authShake_0.35s_ease]" : "border-border"}`}
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (usernameErr) setUsernameErr(validateUsername(e.target.value));
                  }}
                  onBlur={() => setUsernameErr(validateUsername(username))}
                  autoComplete="username"
                />
                <p
                  className={`text-[0.75rem] text-[#ff4466] mt-1 min-h-[1rem] leading-[1.3] transition-all duration-250 ${usernameErr ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}`}
                >
                  {usernameErr ?? "\u00A0"}
                </p>
              </div>

              {/* Email */}
              <div className="mb-4 relative group">
                <label
                  className="block text-[0.8rem] font-medium text-fg-secondary mb-1 transition-colors group-focus-within:text-accent-light"
                  htmlFor="reg-email"
                >
                  Email
                </label>
                <input
                  id="reg-email"
                  className={`w-full px-4 py-3 rounded-[10px] border-[1.5px] bg-bg-primary text-fg-primary text-[0.95rem] outline-none transition-all duration-300 placeholder:text-fg-muted hover:border-accent-dark focus:border-accent focus:bg-bg-secondary focus:shadow-[0_0_0_3px_rgba(233,30,140,0.12),0_0_20px_rgba(233,30,140,0.08)] ${emailErr ? "border-[#ff4466] shadow-[0_0_0_3px_rgba(255,68,102,0.12)] animate-[authShake_0.35s_ease]" : "border-border"}`}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailErr) setEmailErr(validateEmail(e.target.value));
                  }}
                  onBlur={() => setEmailErr(validateEmail(email))}
                  autoComplete="email"
                />
                <p
                  className={`text-[0.75rem] text-[#ff4466] mt-1 min-h-[1rem] leading-[1.3] transition-all duration-250 ${emailErr ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}`}
                >
                  {emailErr ?? "\u00A0"}
                </p>
              </div>

              {/* Password */}
              <div className="mb-4 relative group">
                <label
                  className="block text-[0.8rem] font-medium text-fg-secondary mb-1 transition-colors group-focus-within:text-accent-light"
                  htmlFor="reg-password"
                >
                  Password
                </label>
                <input
                  id="reg-password"
                  className={`w-full px-4 py-3 rounded-[10px] border-[1.5px] bg-bg-primary text-fg-primary text-[0.95rem] outline-none transition-all duration-300 placeholder:text-fg-muted hover:border-accent-dark focus:border-accent focus:bg-bg-secondary focus:shadow-[0_0_0_3px_rgba(233,30,140,0.12),0_0_20px_rgba(233,30,140,0.08)] ${passwordErr ? "border-[#ff4466] shadow-[0_0_0_3px_rgba(255,68,102,0.12)] animate-[authShake_0.35s_ease]" : "border-border"}`}
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordErr) setPasswordErr(validatePassword(e.target.value));
                    if (confirm && confirmErr)
                      setConfirmErr(validateConfirm(e.target.value, confirm));
                  }}
                  onBlur={() => setPasswordErr(validatePassword(password))}
                  autoComplete="new-password"
                />
                <p
                  className={`text-[0.75rem] text-[#ff4466] mt-1 min-h-[1rem] leading-[1.3] transition-all duration-250 ${passwordErr ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}`}
                >
                  {passwordErr ?? "\u00A0"}
                </p>
              </div>

              {/* Confirm Password */}
              <div className="mb-4 relative group">
                <label
                  className="block text-[0.8rem] font-medium text-fg-secondary mb-1 transition-colors group-focus-within:text-accent-light"
                  htmlFor="reg-confirm"
                >
                  Confirm Password
                </label>
                <input
                  id="reg-confirm"
                  className={`w-full px-4 py-3 rounded-[10px] border-[1.5px] bg-bg-primary text-fg-primary text-[0.95rem] outline-none transition-all duration-300 placeholder:text-fg-muted hover:border-accent-dark focus:border-accent focus:bg-bg-secondary focus:shadow-[0_0_0_3px_rgba(233,30,140,0.12),0_0_20px_rgba(233,30,140,0.08)] ${confirmErr ? "border-[#ff4466] shadow-[0_0_0_3px_rgba(255,68,102,0.12)] animate-[authShake_0.35s_ease]" : "border-border"}`}
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    if (confirmErr)
                      setConfirmErr(validateConfirm(password, e.target.value));
                  }}
                  onBlur={() => setConfirmErr(validateConfirm(password, confirm))}
                  autoComplete="new-password"
                />
                <p
                  className={`text-[0.75rem] text-[#ff4466] mt-1 min-h-[1rem] leading-[1.3] transition-all duration-250 ${confirmErr ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}`}
                >
                  {confirmErr ?? "\u00A0"}
                </p>
              </div>

              <button
                type="submit"
                className="w-full p-[0.85rem] mt-2 rounded-[12px] border-none cursor-pointer text-base font-semibold text-white bg-gradient-to-br from-accent to-accent-light transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(233,30,140,0.3)] active:translate-y-0"
              >
                Continue
              </button>

              <div className="flex flex-col items-center mt-6 text-[0.85rem] text-fg-muted">
                <span>
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-accent no-underline font-medium transition-colors duration-200 hover:text-accent-light"
                  >
                    Log In
                  </Link>
                </span>
              </div>
            </form>
          )}

          {/* ═══════════ Step 2 ═══════════ */}
          {step === 2 && (
            <form onSubmit={handleStep2} noValidate key="step2">
              <button
                type="button"
                className="bg-transparent border-none text-fg-secondary text-[0.85rem] cursor-pointer font-[var(--font-family-body)] flex items-center gap-1.5 mb-4 transition-colors duration-200 hover:text-fg-primary"
                onClick={() => setStep(1)}
              >
                ← Back
              </button>

              {/* Avatar */}
              <div className="mb-4">
                <label className="block text-[0.8rem] font-medium text-fg-secondary mb-1">
                  Profile Picture (optional)
                </label>
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={avatar}
                    alt="Avatar preview"
                    className="w-20 h-20 rounded-full border-2 border-border object-cover bg-bg-card transition-colors duration-300 hover:border-accent"
                  />
                  <button
                    type="button"
                    className="text-[0.8rem] text-accent bg-transparent border border-accent rounded-lg px-4 py-1.5 cursor-pointer transition-all duration-200 hover:bg-accent hover:text-white"
                    onClick={() => fileRef.current?.click()}
                  >
                    Choose Image
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleAvatar}
                    className="hidden"
                  />
                </div>
                <p
                  className={`text-[0.75rem] text-[#ff4466] mt-1 min-h-[1rem] leading-[1.3] text-center transition-all duration-250 ${avatarErr ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}`}
                >
                  {avatarErr ?? "\u00A0"}
                </p>
              </div>

              {/* Display Name */}
              <div className="mb-4 relative group">
                <label
                  className="block text-[0.8rem] font-medium text-fg-secondary mb-1 transition-colors group-focus-within:text-accent-light"
                  htmlFor="reg-displayname"
                >
                  Display Name
                </label>
                <input
                  id="reg-displayname"
                  className={`w-full px-4 py-3 rounded-[10px] border-[1.5px] bg-bg-primary text-fg-primary text-[0.95rem] outline-none transition-all duration-300 hover:border-accent-dark focus:border-accent focus:bg-bg-secondary focus:shadow-[0_0_0_3px_rgba(233,30,140,0.12),0_0_20px_rgba(233,30,140,0.08)] ${displayNameErr ? "border-[#ff4466] shadow-[0_0_0_3px_rgba(255,68,102,0.12)] animate-[authShake_0.35s_ease]" : "border-border"}`}
                  type="text"
                  placeholder="How should we call you?"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (displayNameErr)
                      setDisplayNameErr(validateDisplayName(e.target.value));
                  }}
                  onBlur={() =>
                    setDisplayNameErr(validateDisplayName(displayName))
                  }
                />
                <p
                  className={`text-[0.75rem] text-[#ff4466] mt-1 min-h-[1rem] leading-[1.3] transition-all duration-250 ${displayNameErr ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}`}
                >
                  {displayNameErr ?? "\u00A0"}
                </p>
              </div>

              {/* Description */}
              <div className="mb-4 relative group">
                <label
                  className="block text-[0.8rem] font-medium text-fg-secondary mb-1 transition-colors group-focus-within:text-accent-light"
                  htmlFor="reg-description"
                >
                  About You (optional)
                </label>
                <textarea
                  id="reg-description"
                  className={`w-full px-4 py-3 rounded-[10px] border-[1.5px] bg-bg-primary text-fg-primary text-[0.95rem] outline-none resize-y min-h-[100px] transition-all duration-300 placeholder:text-fg-muted hover:border-accent-dark focus:border-accent focus:bg-bg-secondary focus:shadow-[0_0_0_3px_rgba(233,30,140,0.12),0_0_20px_rgba(233,30,140,0.08)] ${description.length > 300 ? "border-[#ff4466] shadow-[0_0_0_3px_rgba(255,68,102,0.12)]" : "border-border"}`}
                  placeholder="Tell us something about yourself…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
                <div
                  className={`text-right text-[0.75rem] mt-1 transition-colors duration-200 ${description.length > 300 ? "text-[#ff4466]" : "text-fg-muted"}`}
                >
                  {description.length}/300
                </div>
              </div>

              <button
                type="submit"
                className="w-full p-[0.85rem] mt-2 rounded-[12px] border-none cursor-pointer text-base font-semibold text-white bg-gradient-to-br from-accent to-accent-light transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(233,30,140,0.3)] active:translate-y-0"
              >
                Create Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
