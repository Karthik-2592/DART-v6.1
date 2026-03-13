import { Package, Instagram, Twitter, Facebook, Youtube } from 'lucide-react'

const SOCIAL_ICONS = [Instagram, Twitter, Facebook, Youtube]

const FOOTER_COLS = [
  { title: 'Company', links: ['About Us', 'Careers', 'Press', 'Blog', 'Contact'] },
  { title: 'Support', links: ['Help Center', 'Track Order', 'Returns', 'Shipping Info', 'Size Guide'] },
  { title: 'Shop',    links: ['New Arrivals', 'Best Sellers', 'Sale', 'Gift Cards', 'Brands'] },
]

export default function Footer() {
  return (
    <footer className="footer">
      {/* Top grid */}
      <div className="footer-top">
        {/* Brand column — logo stands out, description is clearly subordinate */}
        <div className="flex flex-col gap-5">
          <a
            href="#"
            className="flex items-center gap-2.5 text-2xl font-extrabold text-white tracking-tight"
          >
            <Package size={28} className="text-violet-500" />
            Lumière<span className="text-violet-400">Shop</span>
          </a>
          <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
            Premium products, seamless shopping. Your lifestyle, elevated.
          </p>
          <div className="flex gap-2 mt-1">
            {SOCIAL_ICONS.map((Icon, i) => (
              <a key={i} href="#" className="social-link" aria-label="Social">
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {FOOTER_COLS.map(({ title, links }) => (
          <div key={title}>
            <h4 className="text-sm font-bold text-slate-200 mb-5 uppercase tracking-wider">
              {title}
            </h4>
            <ul className="flex flex-col gap-3">
              {links.map((link) => (
                <li key={link}>
                  <a href="#" className="footer-link">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p>© 2025 LumièreShop. All rights reserved.</p>
        <div className="flex gap-6">
          {['Privacy Policy', 'Terms of Service', 'Cookie Settings'].map((l) => (
            <a key={l} href="#" className="footer-link">{l}</a>
          ))}
        </div>
      </div>
    </footer>
  )
}
