import { useState } from 'react'
import {
  ShoppingCart,
  Search,
  Star,
  TrendingUp,
  Shield,
  Truck,
  RefreshCw,
  Heart,
  ChevronRight,
  Menu,
  X,
  Zap,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  ArrowRight,
  Package,
} from 'lucide-react'
import heroBanner from './assets/hero_banner.png'
import './App.css'

// ─── DATA ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 1, name: 'Electronics', icon: '💻', count: 240, color: '#7c3aed' },
  { id: 2, name: 'Fashion', icon: '👗', count: 580, color: '#db2777' },
  { id: 3, name: 'Home & Living', icon: '🛋️', count: 320, color: '#d97706' },
  { id: 4, name: 'Sports', icon: '⚽', count: 190, color: '#059669' },
  { id: 5, name: 'Beauty', icon: '💄', count: 410, color: '#dc2626' },
  { id: 6, name: 'Books', icon: '📚', count: 870, color: '#2563eb' },
]

const PRODUCTS = [
  {
    id: 1,
    name: 'Pro Wireless Headphones',
    price: 299,
    original: 399,
    rating: 4.8,
    reviews: 2140,
    badge: 'Best Seller',
    category: 'Electronics',
    emoji: '🎧',
    gradient: 'from-violet-600 to-indigo-600',
  },
  {
    id: 2,
    name: 'Leather Crossbody Bag',
    price: 149,
    original: 220,
    rating: 4.7,
    reviews: 890,
    badge: 'New Arrival',
    category: 'Fashion',
    emoji: '👜',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    id: 3,
    name: 'Smart Fitness Watch',
    price: 199,
    original: 259,
    rating: 4.9,
    reviews: 3280,
    badge: 'Top Rated',
    category: 'Electronics',
    emoji: '⌚',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    id: 4,
    name: 'Minimalist Desk Lamp',
    price: 79,
    original: 110,
    rating: 4.6,
    reviews: 540,
    badge: 'Sale',
    category: 'Home & Living',
    emoji: '💡',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 5,
    name: 'Yoga Mat Premium',
    price: 59,
    original: 89,
    rating: 4.8,
    reviews: 1670,
    badge: 'Popular',
    category: 'Sports',
    emoji: '🧘',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 6,
    name: 'Vitamin C Serum Set',
    price: 49,
    original: 75,
    rating: 4.7,
    reviews: 2340,
    badge: 'Trending',
    category: 'Beauty',
    emoji: '✨',
    gradient: 'from-fuchsia-500 to-purple-600',
  },
]

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Alexandria Carter',
    avatar: 'AC',
    rating: 5,
    text: 'Absolutely love shopping here! The quality is consistently excellent and delivery is always super fast. My go-to for everything.',
    purchase: 'Wireless Headphones',
    color: '#7c3aed',
  },
  {
    id: 2,
    name: 'Marcus Thompson',
    avatar: 'MT',
    rating: 5,
    text: 'Returns are hassle-free and customer support is outstanding. Found products I couldn\'t get anywhere else at these prices.',
    purchase: 'Smart Fitness Watch',
    color: '#059669',
  },
  {
    id: 3,
    name: 'Priya Sharma',
    avatar: 'PS',
    rating: 5,
    text: 'Been shopping here for 2 years and never disappointed! The curation is superb — feels like they know exactly what I need.',
    purchase: 'Vitamin C Serum Set',
    color: '#db2777',
  },
]

const FEATURES = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over $50', color: '#7c3aed' },
  { icon: RefreshCw, title: 'Easy Returns', desc: '30-day return policy', color: '#059669' },
  { icon: Shield, title: 'Secure Payment', desc: '256-bit SSL encryption', color: '#2563eb' },
  { icon: Zap, title: 'Fast Delivery', desc: '2-day express available', color: '#d97706' },
]

// ─── STAR RATING ─────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= Math.round(rating) ? 'text-amber-400' : 'text-gray-600'}
          fill={s <= Math.round(rating) ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  )
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartCount] = useState(3)

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <a href="#" className="logo">
          <Package className="logo-icon" size={26} />
          <span>Lumière<span className="logo-accent">Shop</span></span>
        </a>

        {/* Desktop nav links */}
        <ul className="nav-links">
          {['New Arrivals', 'Categories', 'Deals', 'Brands', 'About'].map((link) => (
            <li key={link}>
              <a href="#" className="nav-link">{link}</a>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="nav-actions">
          <button className="icon-btn" aria-label="Search"><Search size={20} /></button>
          <button className="icon-btn" aria-label="Wishlist"><Heart size={20} /></button>
          <button className="cart-btn" aria-label="Cart">
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
          <button className="signin-btn">Sign In</button>
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mobile-menu">
          {['New Arrivals', 'Categories', 'Deals', 'Brands', 'About'].map((link) => (
            <a key={link} href="#" className="mobile-link">{link}</a>
          ))}
          <button className="signin-btn mobile-signin">Sign In</button>
        </div>
      )}
    </nav>
  )
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="hero-section">
      <img src={heroBanner} alt="Hero banner" className="hero-bg" />
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-badge">
          <TrendingUp size={14} />
          <span>New Season Collection</span>
        </div>
        <h1 className="hero-heading">
          Discover <span className="hero-accent">Premium</span><br />
          Products You'll Love
        </h1>
        <p className="hero-subtext">
          Curated collections from the world's best brands, delivered right to your door.
          Unbeatable quality, unbeatable prices.
        </p>
        <div className="hero-ctas">
          <a href="#products" className="cta-primary">
            Shop Now <ArrowRight size={18} />
          </a>
          <a href="#categories" className="cta-secondary">Browse Categories</a>
        </div>
        <div className="hero-stats">
          {[
            { value: '50K+', label: 'Products' },
            { value: '200K+', label: 'Customers' },
            { value: '4.9★', label: 'Avg Rating' },
          ].map(({ value, label }) => (
            <div key={label} className="hero-stat">
              <span className="stat-value">{value}</span>
              <span className="stat-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FEATURES BAR ────────────────────────────────────────────────────────────

function FeaturesBar() {
  return (
    <section className="features-bar">
      {FEATURES.map(({ icon: Icon, title, desc, color }) => (
        <div key={title} className="feature-item">
          <div className="feature-icon-wrap" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
            <Icon size={22} style={{ color }} />
          </div>
          <div>
            <p className="feature-title">{title}</p>
            <p className="feature-desc">{desc}</p>
          </div>
        </div>
      ))}
    </section>
  )
}

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

function Categories() {
  return (
    <section className="section" id="categories">
      <div className="section-header">
        <h2 className="section-title">Shop by Category</h2>
        <p className="section-sub">Explore our wide range of carefully curated categories</p>
      </div>
      <div className="categories-grid">
        {CATEGORIES.map(({ id, name, icon, count, color }) => (
          <a href="#" key={id} className="category-card">
            <div className="category-icon" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
              <span className="category-emoji">{icon}</span>
            </div>
            <p className="category-name">{name}</p>
            <p className="category-count">{count} items</p>
            <ChevronRight size={16} className="category-arrow" style={{ color }} />
          </a>
        ))}
      </div>
    </section>
  )
}

// ─── PRODUCT CARD ────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: (typeof PRODUCTS)[0] }) {
  const [liked, setLiked] = useState(false)
  const discount = Math.round(((product.original - product.price) / product.original) * 100)

  return (
    <div className="product-card">
      {/* Image area */}
      <div className={`product-img-wrap bg-gradient-to-br ${product.gradient}`}>
        <span className="product-emoji">{product.emoji}</span>
        <button
          className={`wishlist-btn ${liked ? 'liked' : ''}`}
          onClick={() => setLiked(!liked)}
          aria-label="Toggle wishlist"
        >
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
        </button>
        <span className="product-badge">{product.badge}</span>
      </div>

      {/* Info */}
      <div className="product-info">
        <p className="product-category">{product.category}</p>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-rating">
          <StarRating rating={product.rating} />
          <span className="rating-value">{product.rating}</span>
          <span className="review-count">({product.reviews.toLocaleString()})</span>
        </div>
        <div className="product-price-row">
          <div className="price-group">
            <span className="price-current">${product.price}</span>
            <span className="price-original">${product.original}</span>
            <span className="price-discount">-{discount}%</span>
          </div>
          <button className="add-to-cart-btn">
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── FEATURED PRODUCTS ───────────────────────────────────────────────────────

function FeaturedProducts() {
  return (
    <section className="section section-dark" id="products">
      <div className="section-header">
        <h2 className="section-title">Featured Products</h2>
        <p className="section-sub">Handpicked items our customers absolutely love</p>
      </div>
      <div className="products-grid">
        {PRODUCTS.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
      <div className="center-cta">
        <a href="#" className="cta-outline">
          View All Products <ArrowRight size={18} />
        </a>
      </div>
    </section>
  )
}

// ─── PROMO BANNER ────────────────────────────────────────────────────────────

function PromoBanner() {
  return (
    <section className="promo-banner">
      <div className="promo-inner">
        <div>
          <p className="promo-tag">Limited Time Offer</p>
          <h2 className="promo-title">Get 30% Off Your First Order</h2>
          <p className="promo-sub">Use code <strong>WELCOME30</strong> at checkout. Valid on all categories.</p>
        </div>
        <a href="#" className="promo-btn">Claim Offer <ArrowRight size={18} /></a>
      </div>
    </section>
  )
}

// ─── TESTIMONIALS ────────────────────────────────────────────────────────────

function Testimonials() {
  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">What Our Customers Say</h2>
        <p className="section-sub">Real reviews from verified buyers</p>
      </div>
      <div className="testimonials-grid">
        {TESTIMONIALS.map(({ id, name, avatar, rating, text, purchase, color }) => (
          <div key={id} className="testimonial-card">
            <div className="testimonial-top">
              <div className="avatar" style={{ background: `${color}25`, color }}>
                {avatar}
              </div>
              <div>
                <p className="reviewer-name">{name}</p>
                <p className="reviewer-purchase">Bought: {purchase}</p>
              </div>
            </div>
            <StarRating rating={rating} />
            <p className="testimonial-text">"{text}"</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── NEWSLETTER ──────────────────────────────────────────────────────────────

function Newsletter() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) setSubmitted(true)
  }

  return (
    <section className="newsletter-section">
      <div className="newsletter-inner">
        <div className="newsletter-text">
          <h2 className="newsletter-title">Stay in the Loop</h2>
          <p className="newsletter-sub">
            Subscribe to get exclusive deals, new arrivals, and style inspiration delivered to your inbox.
          </p>
        </div>
        {submitted ? (
          <div className="newsletter-success">
            <span>🎉</span> You're subscribed! Check your inbox for a welcome gift.
          </div>
        ) : (
          <form className="newsletter-form" onSubmit={handleSubmit}>
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
        <p className="newsletter-note">No spam, unsubscribe at any time.</p>
      </div>
    </section>
  )
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────

function Footer() {
  const columns = [
    {
      title: 'Company',
      links: ['About Us', 'Careers', 'Press', 'Blog', 'Contact'],
    },
    {
      title: 'Support',
      links: ['Help Center', 'Track Order', 'Returns', 'Shipping Info', 'Size Guide'],
    },
    {
      title: 'Shop',
      links: ['New Arrivals', 'Best Sellers', 'Sale', 'Gift Cards', 'Brands'],
    },
  ]

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <a href="#" className="logo logo-footer">
            <Package size={24} />
            <span>Lumière<span className="logo-accent">Shop</span></span>
          </a>
          <p className="footer-tagline">
            Premium products, seamless shopping. Your lifestyle, elevated.
          </p>
          <div className="social-links">
            {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="social-link" aria-label="Social">
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
        {columns.map(({ title, links }) => (
          <div key={title} className="footer-col">
            <h4 className="footer-col-title">{title}</h4>
            <ul className="footer-links">
              {links.map((link) => (
                <li key={link}><a href="#" className="footer-link">{link}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <p>© 2025 LumièreShop. All rights reserved.</p>
        <div className="footer-legal">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Cookie Settings</a>
        </div>
      </div>
    </footer>
  )
}

// ─── APP ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main>
        <Hero />
        <FeaturesBar />
        <Categories />
        <FeaturedProducts />
        <PromoBanner />
        <Testimonials />
        <Newsletter />
      </main>
      <Footer />
    </div>
  )
}
