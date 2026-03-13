import { TESTIMONIALS } from '../data'
import StarRating from './StarRating'

export default function Testimonials() {
  return (
    <section className="section">
      {/* Header */}
      <div className="text-center mb-14">
        <h2 className="section-title">What Our Customers Say</h2>
        <p className="text-slate-500 text-base mt-4 leading-relaxed">
          Real reviews from verified buyers
        </p>
      </div>

      {/* Grid */}
      <div className="testimonials-grid">
        {TESTIMONIALS.map(({ id, name, avatar, rating, text, purchase, color }) => (
          <div key={id} className="testimonial-card">
            {/* Author */}
            <div className="flex items-center gap-3.5">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0"
                style={{ background: `${color}25`, color }}
              >
                {avatar}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">{name}</p>
                <p className="text-xs text-slate-500 mt-0.5">Bought: {purchase}</p>
              </div>
            </div>

            <StarRating rating={rating} />

            <p className="text-sm text-slate-400 leading-relaxed">
              "{text}"
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
