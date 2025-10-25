import React, { useEffect, useState } from 'react'
import { ArrowLeft, Star, MapPin, Users } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { useAuth } from './AuthContext'
import { Button } from './ui/button'
import { ImageWithFallback } from './figma/ImageWithFallback'

interface Seller {
  id: string
  name: string
  bio: string
  location: { city: string; lat: number; lng: number }
  avatar: string
  avgRating: number
  reviewCount: number
  distance: number
  followers: number
}

interface CategoryViewProps {
  category: string
  onBack: () => void
  onSellerClick: (sellerId: string) => void
  onViewVideos: (category: string) => void
}

export function CategoryView({ category, onBack, onSellerClick, onViewVideos }: CategoryViewProps) {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchSellers()
  }, [category])

  const fetchSellers = async () => {
    try {
      const lat = user?.location?.lat || 0
      const lng = user?.location?.lng || 0

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/category/${category}/sellers?lat=${lat}&lng=${lng}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setSellers(data)
      }
    } catch (error) {
      console.error('Failed to fetch sellers:', error)
    } finally {
      setLoading(false)
    }
  }

  const categoryNames: Record<string, string> = {
    'flowers': 'Flowers',
    'food-catering': 'Food & Catering',
    'handcrafts': 'Handcrafts',
    'jewelry': 'Jewelry',
    'beauty': 'Beauty & Cosmetics',
    'fashion': 'Fashion & Accessories'
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-accent rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl">{categoryNames[category]}</h1>
              <p className="text-sm text-muted-foreground">
                {sellers.length} sellers found
              </p>
            </div>
          </div>
          <Button onClick={() => onViewVideos(category)}>
            Watch Videos
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-muted-foreground">Loading sellers...</p>
          </div>
        ) : sellers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No sellers found in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sellers.map((seller) => (
              <button
                key={seller.id}
                onClick={() => onSellerClick(seller.id)}
                className="bg-card border border-border rounded-xl shadow-md hover:shadow-xl transition-all p-6 text-left"
              >
                <div className="flex items-start gap-4 mb-4">
                  {seller.avatar ? (
                    <ImageWithFallback
                      src={seller.avatar}
                      alt={seller.name}
                      className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-purple-500"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl flex-shrink-0">
                      {seller.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg truncate mb-1">{seller.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{seller.avgRating.toFixed(1)}</span>
                      <span className="opacity-70">({seller.reviewCount})</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{seller.followers} followers</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {seller.bio || 'No bio available'}
                </p>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {seller.location.city}
                    {seller.distance > 0 && ` • ${seller.distance.toFixed(1)} km away`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
