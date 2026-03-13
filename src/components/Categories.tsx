import { ChevronRight } from 'lucide-react'
import { CATEGORIES } from '../data'

export default function Categories() {
  return (
    <section className="section" id="categories">
      {/* Header — increased bottom margin for breathing room */}
      <div className="text-center mb-14">
        <h2 className="section-title">Shop by Category</h2>
        <p className="text-slate-500 text-base mt-4 leading-relaxed">
          Explore our wide range of carefully curated categories
        </p>
      </div>

      {/* Grid — gap increased for breathing room between cards */}
      <div className="categories-grid">
        {CATEGORIES.map(({ id, name, icon, count, color }) => (
          <a href="#" key={id} className="category-card group">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: `${color}18`, border: `1px solid ${color}30` }}
            >
              <span className="text-3xl">{icon}</span>
            </div>
            <p className="text-sm font-bold text-slate-100 mt-1">{name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{count} items</p>
            <ChevronRight
              size={16}
              className="category-arrow"
              style={{ color }}
            />
          </a>
        ))}
      </div>
    </section>
  )
}
