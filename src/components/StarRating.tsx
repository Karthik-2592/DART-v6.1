import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  size?: number
}

export default function StarRating({ rating, size = 14 }: StarRatingProps) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={s <= Math.round(rating) ? 'text-amber-400' : 'text-gray-600'}
          fill={s <= Math.round(rating) ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  )
}
