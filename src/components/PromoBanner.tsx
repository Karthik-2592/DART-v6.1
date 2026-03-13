import { ArrowRight } from 'lucide-react'

export default function PromoBanner() {
  return (
    <section className="promo-banner">
      <div className="promo-inner">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-violet-300 mb-3">
            Limited Time Offer
          </p>
          <h2 className="promo-title">Get 30% Off Your First Order</h2>
          <p className="text-white/70 text-base">
            Use code <strong className="text-white">WELCOME30</strong> at checkout.
            Valid on all categories.
          </p>
        </div>

        <a href="#" className="promo-btn">
          Claim Offer <ArrowRight size={18} />
        </a>
      </div>
    </section>
  )
}
