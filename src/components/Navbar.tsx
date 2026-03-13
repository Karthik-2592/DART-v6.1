import { useState } from 'react'
import { ShoppingCart, Search, Heart, Menu, X, Package } from 'lucide-react'

const NAV_LINKS = ['New Arrivals', 'Categories', 'Deals', 'Brands', 'About']

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartCount] = useState(3)

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <a href="#" className="logo">
          <Package className="text-violet-600" size={26} />
          <span>
            Lumière<span className="text-violet-400">Shop</span>
          </span>
        </a>

        {/* Desktop nav */}
        <ul className="hidden md:flex gap-1 flex-1">
          {NAV_LINKS.map((link) => (
            <li key={link}>
              <a href="#" className="nav-link">{link}</a>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button className="icon-btn" aria-label="Search"><Search size={20} /></button>
          <button className="icon-btn" aria-label="Wishlist"><Heart size={20} /></button>
          <button className="cart-btn" aria-label="Cart">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount}</span>
            )}
          </button>
          <button className="signin-btn hidden md:inline-flex">Sign In</button>
          {/* Menu toggle — kept as the last action so dropdown aligns beneath it */}
          <button
            className="icon-btn md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown — flex-end aligns links under the hamburger button */}
      {mobileOpen && (
        <div className="flex flex-col items-end px-4 pb-5 pt-3 gap-1 border-t border-white/5">
          {NAV_LINKS.map((link) => (
            <a key={link} href="#" className="mobile-link w-full text-right">{link}</a>
          ))}
          <button className="signin-btn mt-3">Sign In</button>
        </div>
      )}
    </nav>
  )
}
