import React, { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { MapPin, Users, Heart, MessageCircle, Star } from 'lucide-react'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface Seller {
  id: string
  name: string
  email: string
  bio: string
  location: { city: string; lat: number; lng: number }
  interests: string[]
  followers: number
  following: number
  avatar: string
  phone: string
  isSeller: boolean
  businessName?: string
  businessCategory?: string
  averageRating?: number
  reviewCount?: number
}

interface SellerMatchingProps {
  onClose: () => void
}

export function SellerMatching({ onClose }: SellerMatchingProps) {
  const [matchedSellers, setMatchedSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, accessToken } = useAuth()

  useEffect(() => {
    if (user && user.isSeller) {
      fetchMatchedSellers()
    } else {
      setError('Only sellers can view matched sellers')
      setLoading(false)
    }
  }, [user])

  const fetchMatchedSellers = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/seller-matching/${user?.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setMatchedSellers(data.matchedSellers || [])
      } else {
        setError('Failed to fetch matched sellers')
      }
    } catch (err) {
      setError('Failed to fetch matched sellers')
    } finally {
      setLoading(false)
    }
  }

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const getMatchingScore = (seller: Seller) => {
    if (!user) return 0
    
    let score = 0
    
    // Interest matching (40% weight)
    const commonInterests = seller.interests.filter(interest => 
      user.interests.includes(interest)
    ).length
    const interestScore = (commonInterests / Math.max(seller.interests.length, user.interests.length)) * 40
    score += interestScore
    
    // Distance matching (30% weight)
    const distance = calculateDistance(
      user.location.lat, user.location.lng,
      seller.location.lat, seller.location.lng
    )
    const maxDistance = 50 // 50km max for good score
    const distanceScore = Math.max(0, (maxDistance - distance) / maxDistance) * 30
    score += distanceScore
    
    // Rating matching (20% weight)
    if (seller.averageRating) {
      const ratingScore = (seller.averageRating / 5) * 20
      score += ratingScore
    }
    
    // Follower count matching (10% weight)
    const followerScore = Math.min(seller.followers / 1000, 1) * 10
    score += followerScore
    
    return Math.round(score)
  }

  const getDistanceText = (seller: Seller) => {
    if (!user) return ''
    const distance = calculateDistance(
      user.location.lat, user.location.lng,
      seller.location.lat, seller.location.lng
    )
    return `${distance.toFixed(1)} km away`
  }

  const getCommonInterests = (seller: Seller) => {
    if (!user) return []
    return seller.interests.filter(interest => 
      user.interests.includes(interest)
    )
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-muted-foreground">Finding matching sellers...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={onClose}>Close</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Seller Matching
          </CardTitle>
          <CardDescription>
            Discover sellers with complementary interests and nearby locations
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {matchedSellers.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No matches found</h3>
              <p className="text-muted-foreground">
                We're looking for sellers with complementary interests and nearby locations.
                Check back later for new matches!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {matchedSellers.map((seller) => {
                const matchingScore = getMatchingScore(seller)
                const distance = getDistanceText(seller)
                const commonInterests = getCommonInterests(seller)
                
                return (
                  <Card key={seller.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
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

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-medium">{seller.name}</h3>
                              {seller.businessName && (
                                <p className="text-sm text-muted-foreground">{seller.businessName}</p>
                              )}
                              {seller.businessCategory && (
                                <Badge variant="outline" className="mt-1">
                                  {seller.businessCategory}
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">
                                {matchingScore}%
                              </div>
                              <div className="text-xs text-muted-foreground">Match Score</div>
                            </div>
                          </div>

                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {seller.bio || 'No bio available'}
                          </p>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{seller.location.city}</span>
                              <span className="text-xs">({distance})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{seller.followers} followers</span>
                            </div>
                            {seller.averageRating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span>{seller.averageRating.toFixed(1)} ({seller.reviewCount} reviews)</span>
                              </div>
                            )}
                          </div>

                          {commonInterests.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-medium mb-1">Common Interests:</p>
                              <div className="flex flex-wrap gap-1">
                                {commonInterests.map((interest, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {interest}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Message
                            </Button>
                            <Button size="sm" variant="outline">
                              <Heart className="w-4 h-4 mr-1" />
                              Connect
                            </Button>
                            <Button size="sm">
                              View Profile
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">How Seller Matching Works</h3>
            <ul className="text-sm space-y-1">
              <li>• <strong>Interest Matching (40%):</strong> Sellers with complementary interests get higher scores</li>
              <li>• <strong>Distance Matching (30%):</strong> Closer sellers are prioritized for collaboration</li>
              <li>• <strong>Rating Matching (20%):</strong> Higher-rated sellers get better visibility</li>
              <li>• <strong>Popularity (10%):</strong> Sellers with more followers get slight boost</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
