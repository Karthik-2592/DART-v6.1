import { Link } from "react-router-dom";

export default function Placeholder() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary text-center px-6">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-accent-dark/20 border border-accent/20 flex items-center justify-center mb-8">
        <svg
          className="w-10 h-10 text-accent"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.42 15.17l-5.657-5.657a8 8 0 1111.314 0l-5.657 5.657z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v.01"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-bold font-[var(--font-family-heading)] text-fg-primary mb-3">
        Page Under Construction
      </h1>
      <p className="text-fg-secondary mb-8 max-w-md">
        This page isn't ready yet. We're working on something awesome — check
        back soon!
      </p>
      <Link to="/" className="no-underline">
        <button className="btn-accent">← Back to Home</button>
      </Link>
    </div>
  );
}
