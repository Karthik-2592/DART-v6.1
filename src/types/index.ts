import type { LucideIcon } from 'lucide-react'

export interface Category {
  id: number
  name: string
  icon: string
  count: number
  color: string
}

export interface Product {
  id: number
  name: string
  price: number
  original: number
  rating: number
  reviews: number
  badge: string
  category: string
  emoji: string
  gradient: string
}

export interface Testimonial {
  id: number
  name: string
  avatar: string
  rating: number
  text: string
  purchase: string
  color: string
}

export interface Feature {
  icon: LucideIcon
  title: string
  desc: string
  color: string
}
