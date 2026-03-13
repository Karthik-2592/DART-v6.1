import { TrendingUp, ArrowRight } from 'lucide-react'
import heroBanner from '../assets/hero_banner.png'

const STATS = [
  { value: '50K+',  label: 'Products'   },
  { value: '200K+', label: 'Customers'  },
  { value: '4.9★',  label: 'Avg Rating' },
]

export default function Hero() {
  return (
    <section className="hero-section">
      <img src={heroBanner} alt="" className="hero-bg" />
      <div className="hero-overlay" />

      <div className="hero-content">
        {/* Badge */}
        <div className="hero-badge">
          <TrendingUp size={14} />
          <span>New Season Collection</span>
        </div>

        {/* Heading */}
        <h1 className="hero-heading">
          Discover <span className="hero-accent">Premium</span>
          <br />
          Products You'll Love
        </h1>

        {/* Sub-text */}
        <p className="hero-subtext">
          Curated collections from the world's best brands, delivered right to
          your door. Unbeatable quality, unbeatable prices.
        </p>

        {/* CTAs */}
        <div className="hero-ctas">
          <a href="#products" className="cta-primary">
            Shop Now <ArrowRight size={18} />
          </a>
          <a href="#categories" className="cta-secondary">
            Browse Categories
          </a>
        </div>

        {/* Stats */}
        <div className="hero-stats">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-2xl font-extrabold text-white">{value}</span>
              <span className="text-xs font-medium text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
