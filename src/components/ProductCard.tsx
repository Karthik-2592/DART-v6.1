import { useState } from 'react'
import { Heart, ShoppingCart } from 'lucide-react'
import type { Product } from '../types'
import StarRating from './StarRating'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const [liked, setLiked] = useState(false)
  const discount = Math.round(
    ((product.original - product.price) / product.original) * 100,
  )

  return (
    <div className="product-card">
      {/* Image area — gradient from data */}
      <div className={`product-img-wrap bg-gradient-to-br ${product.gradient}`}>
        <span className="product-emoji">{product.emoji}</span>

        {/* Wishlist */}
        <button
          className={`wishlist-btn${liked ? ' liked' : ''}`}
          onClick={() => setLiked(!liked)}
          aria-label="Toggle wishlist"
        >
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
        </button>

        {/* Badge */}
        <span className="product-badge">{product.badge}</span>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-5">
        <p className="text-xs font-semibold text-violet-500 uppercase tracking-widest">
          {product.category}
        </p>
        <h3 className="text-base font-bold text-slate-100 leading-snug">
          {product.name}
        </h3>

        {/* Rating row */}
        <div className="flex items-center gap-1.5">
          <StarRating rating={product.rating} />
          <span className="text-xs font-bold text-slate-100">{product.rating}</span>
          <span className="text-xs text-slate-500">
            ({product.reviews.toLocaleString()})
          </span>
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-slate-100">
              ${product.price}
            </span>
            <span className="text-sm text-slate-500 line-through">
              ${product.original}
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
              -{discount}%
            </span>
          </div>

          <button
            className="add-to-cart-btn"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
