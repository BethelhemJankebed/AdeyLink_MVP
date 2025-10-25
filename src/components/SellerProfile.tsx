import React, { useEffect, useState } from 'react'
import { ArrowLeft, Star, Users, MapPin, MessageCircle, Heart, Plus, UserPlus } from 'lucide-react'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { useAuth } from './AuthContext'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Card, CardContent } from './ui/card'
import { Textarea } from './ui/textarea'
import { AddProduct } from './AddProduct'
import { BecomeSeller } from './BecomeSeller'
import { CODOrder } from './CODOrder'
import { DeliveryTracking } from './DeliveryTracking'

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
}

interface Product {
  id: string
  title: string
  description: string
  price: number
  category: string
  images: string[]
  available: boolean
}

interface Review {
  id: string
  rating: number
  comment: string
  date: string
  buyer: {
    id: string
    name: string
    avatar: string
  }
}

interface Video {
  id: string
  title: string
  description: string
  videoUrl: string
  likes: number
  commentCount: number
}

interface SellerProfileProps {
  sellerId: string
  onBack: () => void
  onMessageClick: (sellerId: string) => void
  onProductClick: (productId: string) => void
}

export function SellerProfile({ sellerId, onBack, onMessageClick, onProductClick }: SellerProfileProps) {
  const [seller, setSeller] = useState<Seller | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' })
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showBecomeSeller, setShowBecomeSeller] = useState(false)
  const [showCODOrder, setShowCODOrder] = useState(false)
  const [showDeliveryTracking, setShowDeliveryTracking] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null)
  const { user, accessToken } = useAuth()

  useEffect(() => {
    fetchSellerData()
  }, [sellerId])

  const fetchSellerData = async () => {
    try {
      // Fetch seller profile
      const sellerResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/user/${sellerId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      )
      if (sellerResponse.ok) {
        setSeller(await sellerResponse.json())
      }

      // Fetch products
      const productsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/seller/${sellerId}/products`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      )
      if (productsResponse.ok) {
        setProducts(await productsResponse.json())
      }

      // Fetch reviews
      const reviewsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/seller/${sellerId}/reviews`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      )
      if (reviewsResponse.ok) {
        setReviews(await reviewsResponse.json())
      }

      // Fetch videos
      const videosResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/seller/${sellerId}/videos`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      )
      if (videosResponse.ok) {
        setVideos(await videosResponse.json())
      }

      // Check follow status
      if (user && accessToken) {
        const followResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/follow/${sellerId}/status`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        )
        if (followResponse.ok) {
          const data = await followResponse.json()
          setIsFollowing(data.following)
        }
      }
    } catch (error) {
      console.error('Failed to fetch seller data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!user || !accessToken) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/follow/${sellerId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setIsFollowing(data.following)
        
        // Update local seller follower count
        if (seller) {
          setSeller({
            ...seller,
            followers: seller.followers + (data.following ? 1 : -1)
          })
        }
      }
    } catch (error) {
      console.error('Follow error:', error)
    }
  }

  const handleAddReview = async () => {
    if (!user || !accessToken || !newReview.comment.trim()) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/reviews`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            sellerId,
            rating: newReview.rating,
            comment: newReview.comment
          })
        }
      )

      if (response.ok) {
        setNewReview({ rating: 5, comment: '' })
        
        // Refresh reviews
        const reviewsResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/seller/${sellerId}/reviews`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`
            }
          }
        )
        if (reviewsResponse.ok) {
          setReviews(await reviewsResponse.json())
        }
      }
    } catch (error) {
      console.error('Add review error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Seller not found</p>
      </div>
    )
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <button onClick={onBack} className="p-2 hover:bg-accent rounded-full mb-4 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="flex items-start gap-6">
            {seller.avatar ? (
              <ImageWithFallback
                src={seller.avatar}
                alt={seller.name}
                className="w-24 h-24 rounded-full object-cover flex-shrink-0 border-4 border-purple-500"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-4xl flex-shrink-0">
                {seller.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-3xl mb-2">{seller.name}</h1>
              
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span>{avgRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({reviews.length} reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span>{seller.followers} followers</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">{seller.location.city}</span>
                </div>
              </div>

              <p className="text-muted-foreground mb-4 max-w-2xl">{seller.bio || 'No bio available'}</p>

              {user && (
                user.id === sellerId ? (
                  // Only show "Add Product" if user is a seller
                  user.isSeller ? (
                    <Button onClick={() => setShowAddProduct(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  ) : (
                    <div className="flex gap-3">
                      <Button onClick={() => setShowBecomeSeller(true)} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Become a Seller
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="flex gap-3">
                    <Button onClick={handleFollow} variant={isFollowing ? 'outline' : 'default'}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      {isFollowing ? 'Connected' : 'Connect'}
                    </Button>
                    <Button onClick={() => onMessageClick(sellerId)} variant="outline">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    <Button 
                      onClick={() => {
                        // Show COD order for all products
                        setShowCODOrder(true)
                      }} 
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Order COD
                    </Button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
            <TabsTrigger value="videos">Videos ({videos.length})</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="mb-4">About</h3>
                <p className="text-muted-foreground mb-6">{seller.bio || 'No bio available'}</p>
                
                {seller.interests.length > 0 && (
                  <>
                    <h3 className="mb-3">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {seller.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            {products.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No products yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      if (user && user.id !== sellerId) {
                        // For buyers, show COD order
                        setSelectedProduct(product)
                        setShowCODOrder(true)
                      } else {
                        // For sellers, show product details
                        onProductClick(product.id)
                      }
                    }}
                    className="bg-card border border-border rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden text-left"
                  >
                    {product.images && product.images.length > 0 && product.images[0] ? (
                      <ImageWithFallback
                        src={product.images[0]}
                        alt={product.title}
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <div className="aspect-square bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                        <span className="text-4xl">📦</span>
                      </div>
                    )}
                    <div className="p-4">
                      <h4 className="mb-2 truncate">{product.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-purple-600 dark:text-purple-400">${product.price.toFixed(2)}</p>
                        {!product.available && (
                          <span className="text-xs text-red-600">Out of stock</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos" className="mt-6">
            {videos.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No videos yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <div key={video.id} className="bg-card border border-border rounded-lg shadow-md overflow-hidden">
                    <div className="aspect-video bg-gradient-to-br from-purple-300 to-pink-300 flex items-center justify-center">
                      <span className="text-4xl">▶️</span>
                    </div>
                    <div className="p-4">
                      <h4 className="mb-2">{video.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{video.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {video.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {video.commentCount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6 space-y-6">
            {/* Review Summary */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Customer Reviews</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-lg font-medium">{avgRating.toFixed(1)}</span>
                    </div>
                    <span className="text-muted-foreground">({reviews.length} reviews)</span>
                  </div>
                </div>
                
                {/* Rating Distribution */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = reviews.filter(r => r.rating === rating).length
                    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                    return (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="text-sm w-8">{rating}</span>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Write Review */}
            {user && user.id !== sellerId && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="mb-4">Write a Review</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium">Rating *</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setNewReview({ ...newReview, rating })}
                            className="p-1 hover:scale-110 transition-transform"
                            type="button"
                          >
                            <Star
                              className={`w-8 h-8 ${
                                rating <= newReview.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300 hover:text-yellow-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {newReview.rating === 1 && 'Poor'}
                        {newReview.rating === 2 && 'Fair'}
                        {newReview.rating === 3 && 'Good'}
                        {newReview.rating === 4 && 'Very Good'}
                        {newReview.rating === 5 && 'Excellent'}
                      </p>
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium">Your Review *</label>
                      <Textarea
                        placeholder="Share your experience with this seller..."
                        value={newReview.comment}
                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                        rows={4}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {newReview.comment.length}/500 characters
                      </p>
                    </div>
                    <Button 
                      onClick={handleAddReview}
                      disabled={!newReview.comment.trim() || newReview.comment.length > 500}
                      className="w-full"
                    >
                      Submit Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {reviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No reviews yet</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        {review.buyer?.avatar ? (
                          <ImageWithFallback
                            src={review.buyer.avatar}
                            alt={review.buyer.name}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-purple-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white flex-shrink-0 border-2 border-purple-200">
                            {review.buyer?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{review.buyer?.name || 'Anonymous'}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= review.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-muted-foreground/30'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {review.rating === 1 && 'Poor'}
                                  {review.rating === 2 && 'Fair'}
                                  {review.rating === 3 && 'Good'}
                                  {review.rating === 4 && 'Very Good'}
                                  {review.rating === 5 && 'Excellent'}
                                </span>
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <AddProduct
          onClose={() => setShowAddProduct(false)}
          onSuccess={() => {
            // Refresh products
            fetchSellerData()
          }}
        />
      )}

      {/* Become Seller Modal */}
      {showBecomeSeller && (
        <BecomeSeller
          onClose={() => setShowBecomeSeller(false)}
          onSuccess={() => {
            // Refresh user data and seller data
            if (user) {
              // Update user's isSeller status
              user.isSeller = true
            }
            fetchSellerData()
          }}
        />
      )}

      {/* COD Order Modal */}
      {showCODOrder && selectedProduct && seller && (
        <CODOrder
          product={selectedProduct}
          seller={seller}
          onClose={() => {
            setShowCODOrder(false)
            setSelectedProduct(null)
          }}
          onSuccess={(orderId) => {
            setShowCODOrder(false)
            setSelectedProduct(null)
            setTrackingOrderId(orderId)
            setShowDeliveryTracking(true)
          }}
        />
      )}

      {/* Delivery Tracking Modal */}
      {showDeliveryTracking && trackingOrderId && (
        <DeliveryTracking
          orderId={trackingOrderId}
          onClose={() => {
            setShowDeliveryTracking(false)
            setTrackingOrderId(null)
          }}
        />
      )}
    </div>
  )
}
