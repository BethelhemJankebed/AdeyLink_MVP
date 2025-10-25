import React, { useEffect, useState } from 'react'
import { X, ShoppingCart } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { useAuth } from './AuthContext'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { toast } from 'sonner@2.0.3'

interface Product {
  id: string
  sellerId: string
  title: string
  description: string
  price: number
  category: string
  images: string[]
  available: boolean
  createdAt: string
}

interface Seller {
  id: string
  name: string
  avatar: string
}

interface ProductDetailProps {
  productId: string
  sellerId: string
  onClose: () => void
  onSellerClick: (sellerId: string) => void
}

export function ProductDetail({ productId, sellerId, onClose, onSellerClick }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [seller, setSeller] = useState<Seller | null>(null)
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const { user, accessToken } = useAuth()

  useEffect(() => {
    fetchProductAndSeller()
  }, [productId, sellerId])

  const fetchProductAndSeller = async () => {
    try {
      // Fetch product
      const productsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/seller/${sellerId}/products`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      )
      
      if (productsResponse.ok) {
        const products = await productsResponse.json()
        const foundProduct = products.find((p: Product) => p.id === productId)
        setProduct(foundProduct || null)
      }

      // Fetch seller
      const sellerResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/user/${sellerId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      )
      
      if (sellerResponse.ok) {
        const sellerData = await sellerResponse.json()
        setSeller(sellerData)
      }
    } catch (error) {
      console.error('Failed to fetch product details:', error)
      toast.error('Failed to load product details')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!user || !accessToken || !product) {
      toast.error('Please log in to add items to cart')
      return
    }

    setAddingToCart(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/cart`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            productId: product.id,
            sellerId: product.sellerId,
            quantity: 1
          })
        }
      )

      if (response.ok) {
        toast.success('Added to cart!')
      } else {
        toast.error('Failed to add to cart')
      }
    } catch (error) {
      console.error('Add to cart error:', error)
      toast.error('Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Loading product...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Product not found</p>
            <Button onClick={onClose}>Close</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="max-w-2xl w-full my-8">
        <CardContent className="p-0">
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-2xl">Product Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Product Image */}
            {product.images && product.images.length > 0 && product.images[0] ? (
              <ImageWithFallback
                src={product.images[0]}
                alt={product.title}
                className="aspect-video w-full object-cover rounded-lg mb-6"
              />
            ) : (
              <div className="aspect-video bg-gradient-to-br from-purple-200 to-pink-200 rounded-lg mb-6 flex items-center justify-center">
                <span className="text-6xl">📦</span>
              </div>
            )}

            {/* Product Info */}
            <div className="mb-6">
              <h3 className="text-3xl mb-2">{product.title}</h3>
              <p className="text-2xl text-purple-600 dark:text-purple-400 mb-4">${product.price.toFixed(2)}</p>
              
              {!product.available && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg mb-4 inline-block">
                  Out of Stock
                </div>
              )}
              
              <p className="text-muted-foreground mb-4">{product.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                  {product.category}
                </span>
              </div>
            </div>

            {/* Seller Info */}
            {seller && (
              <div className="border-t border-border pt-6 mb-6">
                <h4 className="text-sm text-muted-foreground mb-3">Sold by</h4>
                <button
                  onClick={() => {
                    onClose()
                    onSellerClick(seller.id)
                  }}
                  className="flex items-center gap-3 hover:bg-accent p-3 rounded-lg -ml-3 transition-colors"
                >
                  {seller.avatar ? (
                    <ImageWithFallback
                      src={seller.avatar}
                      alt={seller.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-purple-500"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white flex-shrink-0">
                      {seller.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-sm">{seller.name}</p>
                    <p className="text-xs text-muted-foreground">View seller profile</p>
                  </div>
                </button>
              </div>
            )}

            {/* Actions */}
            {user && user.id !== sellerId && (
              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.available || addingToCart}
                  className="flex-1"
                  size="lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
