import { ArrowRight } from 'lucide-react'
import { PRODUCTS } from '../data'
import ProductCard from './ProductCard'

export default function FeaturedProducts() {
  return (
    // Outer uses section-dark for the faint background tint.
    // All inner blocks use max-w-7xl + px-6 to maintain consistent side margins.
    <section className="section-dark" id="products">
      {/* Header */}
      <div className="text-center max-w-7xl mx-auto px-6 pt-20 mb-14">
        <h2 className="section-title">Featured Products</h2>
        <p className="text-slate-500 text-base mt-4 leading-relaxed">
          Handpicked items our customers absolutely love
        </p>
      </div>

      {/* Product grid — px-6 gives consistent left/right margins */}
      <div className="products-grid max-w-7xl mx-auto px-6">
        {PRODUCTS.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {/* CTA */}
      <div className="flex justify-center max-w-7xl mx-auto px-6 pt-14 pb-20">
        <a href="#" className="cta-outline">
          View All Products <ArrowRight size={18} />
        </a>
      </div>
    </section>
  )
}
