import React, { useEffect, useState } from 'react'
import { ArrowLeft, Trash2, ShoppingBag } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { useAuth } from './AuthContext'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'

interface CartItem {
  productId: string
  quantity: number
  addedAt: string
  product: {
    id: string
    title: string
    description: string
    price: number
    sellerId: string
    available: boolean
  }
}

interface CartProps {
  onBack: () => void
}

export function Cart({ onBack }: CartProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const { user, accessToken } = useAuth()

  useEffect(() => {
    if (user && accessToken) {
      fetchCart()
    }
  }, [user, accessToken])

  const fetchCart = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/cart`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setCartItems(data)
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveItem = async (productId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/cart/${productId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        setCartItems(prev => prev.filter(item => item.productId !== productId))
      }
    } catch (error) {
      console.error('Failed to remove item:', error)
    }
  }

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return

    setPlacingOrder(true)
    try {
      const products = cartItems.map(item => ({
        productId: item.productId,
        sellerId: item.product.sellerId,
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity
      }))

      const total = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      )

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            products,
            total,
            paymentMethod: 'COD'
          })
        }
      )

      if (response.ok) {
        const orderData = await response.json()
        
        // Get seller phone numbers
        const sellerPhones = await Promise.all(
          cartItems.map(async (item) => {
            const sellerResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/user/${item.product.sellerId}`,
              {
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`
                }
              }
            )
            if (sellerResponse.ok) {
              const seller = await sellerResponse.json()
              return seller.phone
            }
            return null
          })
        )
        
        const phoneList = sellerPhones.filter(Boolean).join(', ')
        
        alert(`✅ Order Complete!\n\n📦 Your delivery will be ready in 3-5 days.\n💰 Payment: Cash on Delivery\n📞 Seller contact: ${phoneList || 'Check your messages'}\n\nThank you for shopping with AdeyLink!`)
        setCartItems([])
        onBack()
      } else {
        alert('Failed to place order. Please try again.')
      }
    } catch (error) {
      console.error('Place order error:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setPlacingOrder(false)
    }
  }

  const total = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Please log in to view your cart</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-accent rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl">Shopping Cart</h1>
            <p className="text-sm text-muted-foreground">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Loading cart...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button onClick={onBack}>Continue Shopping</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <Card key={item.productId}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl">📦</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-2">{item.product.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {item.product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-600 dark:text-purple-400">
                              ${item.product.price.toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.productId)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="sticky bottom-4 border-2 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xl">Total:</span>
                  <span className="text-2xl text-purple-600 dark:text-purple-400">
                    ${total.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  💰 Payment Method: Cash on Delivery (COD)
                </p>
                <Button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="w-full"
                  size="lg"
                >
                  {placingOrder ? 'Placing Order...' : 'Place Order'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
