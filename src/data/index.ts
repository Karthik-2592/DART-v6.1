import { Truck, RefreshCw, Shield, Zap } from 'lucide-react'
import type { Category, Product, Testimonial, Feature } from '../types'

export const CATEGORIES: Category[] = [
  { id: 1, name: 'Electronics', icon: '💻', count: 240, color: '#7c3aed' },
  { id: 2, name: 'Fashion',     icon: '👗', count: 580, color: '#db2777' },
  { id: 3, name: 'Home & Living', icon: '🛋️', count: 320, color: '#d97706' },
  { id: 4, name: 'Sports',      icon: '⚽', count: 190, color: '#059669' },
  { id: 5, name: 'Beauty',      icon: '💄', count: 410, color: '#dc2626' },
  { id: 6, name: 'Books',       icon: '📚', count: 870, color: '#2563eb' },
]

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Pro Wireless Headphones',
    price: 299, original: 399,
    rating: 4.8, reviews: 2140,
    badge: 'Best Seller',
    category: 'Electronics',
    emoji: '🎧',
    gradient: 'from-violet-600 to-indigo-600',
  },
  {
    id: 2,
    name: 'Leather Crossbody Bag',
    price: 149, original: 220,
    rating: 4.7, reviews: 890,
    badge: 'New Arrival',
    category: 'Fashion',
    emoji: '👜',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    id: 3,
    name: 'Smart Fitness Watch',
    price: 199, original: 259,
    rating: 4.9, reviews: 3280,
    badge: 'Top Rated',
    category: 'Electronics',
    emoji: '⌚',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    id: 4,
    name: 'Minimalist Desk Lamp',
    price: 79, original: 110,
    rating: 4.6, reviews: 540,
    badge: 'Sale',
    category: 'Home & Living',
    emoji: '💡',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 5,
    name: 'Yoga Mat Premium',
    price: 59, original: 89,
    rating: 4.8, reviews: 1670,
    badge: 'Popular',
    category: 'Sports',
    emoji: '🧘',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 6,
    name: 'Vitamin C Serum Set',
    price: 49, original: 75,
    rating: 4.7, reviews: 2340,
    badge: 'Trending',
    category: 'Beauty',
    emoji: '✨',
    gradient: 'from-fuchsia-500 to-purple-600',
  },
]

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'Alexandria Carter', avatar: 'AC', rating: 5,
    text: 'Absolutely love shopping here! The quality is consistently excellent and delivery is always super fast. My go-to for everything.',
    purchase: 'Wireless Headphones',
    color: '#7c3aed',
  },
  {
    id: 2,
    name: 'Marcus Thompson', avatar: 'MT', rating: 5,
    text: "Returns are hassle-free and customer support is outstanding. Found products I couldn't get anywhere else at these prices.",
    purchase: 'Smart Fitness Watch',
    color: '#059669',
  },
  {
    id: 3,
    name: 'Priya Sharma', avatar: 'PS', rating: 5,
    text: 'Been shopping here for 2 years and never disappointed! The curation is superb — feels like they know exactly what I need.',
    purchase: 'Vitamin C Serum Set',
    color: '#db2777',
  },
]

export const FEATURES: Feature[] = [
  { icon: Truck,     title: 'Free Shipping',  desc: 'On orders over $50',     color: '#7c3aed' },
  { icon: RefreshCw, title: 'Easy Returns',   desc: '30-day return policy',   color: '#059669' },
  { icon: Shield,    title: 'Secure Payment', desc: '256-bit SSL encryption', color: '#2563eb' },
  { icon: Zap,       title: 'Fast Delivery',  desc: '2-day express available', color: '#d97706' },
]
