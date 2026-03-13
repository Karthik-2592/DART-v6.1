import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) setSubmitted(true)
  }

  return (
    <section className="newsletter-section">
      {/* Constrain to readable width — not full screen width */}
      <div className="max-w-2xl mx-auto px-8 py-24 text-center flex flex-col items-center gap-10">

        {/* Text block with clear internal spacing */}
        <div className="flex flex-col gap-4">
          <h2 className="newsletter-title">Stay in the Loop</h2>
          <p className="text-slate-400 text-base leading-relaxed max-w-md mx-auto">
            Subscribe to get exclusive deals, new arrivals, and style inspiration
            delivered to your inbox.
          </p>
        </div>

        {/* Form — capped at a sensible width rather than full container */}
        {submitted ? (
          <div className="newsletter-success">
            <span>🎉</span> You're subscribed! Check your inbox for a welcome gift.
          </div>
        ) : (
          <form
            className="newsletter-form w-full max-w-md"
            onSubmit={handleSubmit}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="newsletter-input"
              required
            />
            <button type="submit" className="newsletter-btn">
              Subscribe <ArrowRight size={18} />
            </button>
          </form>
        )}

        <p className="text-xs text-slate-600 -mt-4">No spam, unsubscribe at any time.</p>
      </div>
    </section>
  )
}
