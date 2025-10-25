import React, { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { MapPin, Clock, Phone, Package, CheckCircle, Truck, User, RotateCcw } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { RefundRequest } from './RefundRequest'

interface DeliveryLocation {
  lat: number
  lng: number
  timestamp: string
  status: string
}

interface Order {
  id: string
  productId: string
  sellerId: string
  buyerId: string
  quantity: number
  totalAmount: number
  deliveryAddress: string
  deliveryPhone: string
  deliveryNotes: string
  estimatedDeliveryTime: string
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
  createdAt: string
  product: {
    title: string
    price: number
    images: string[]
  }
  seller: {
    name: string
    phone: string
    location: { city: string; lat: number; lng: number }
  }
  deliveryPerson?: {
    name: string
    phone: string
    location: DeliveryLocation
  }
}

interface DeliveryTrackingProps {
  orderId: string
  onClose: () => void
}

export function DeliveryTracking({ orderId, onClose }: DeliveryTrackingProps) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRefundRequest, setShowRefundRequest] = useState(false)
  const { user, accessToken } = useAuth()

  useEffect(() => {
    fetchOrderDetails()
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchOrderDetails, 30000)
    return () => clearInterval(interval)
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/order/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const orderData = await response.json()
        setOrder(orderData)
      } else {
        setError('Failed to fetch order details')
      }
    } catch (err) {
      setError('Failed to fetch order details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'preparing': return 'bg-purple-100 text-purple-800'
      case 'out_for_delivery': return 'bg-orange-100 text-orange-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'preparing': return <Package className="w-4 h-4" />
      case 'out_for_delivery': return <Truck className="w-4 h-4" />
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <Clock className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Order Pending'
      case 'confirmed': return 'Order Confirmed'
      case 'preparing': return 'Preparing Order'
      case 'out_for_delivery': return 'Out for Delivery'
      case 'delivered': return 'Delivered'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  const canCancel = (status: string) => {
    return ['pending', 'confirmed', 'preparing'].includes(status)
  }

  const canReturn = (status: string) => {
    return status === 'delivered'
  }

  const canRequestRefund = (status: string, deliveredAt: string) => {
    if (status !== 'delivered') return false
    const deliveredDate = new Date(deliveredAt)
    const currentDate = new Date()
    const daysSinceDelivery = Math.floor((currentDate.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceDelivery <= 2
  }

  const handleCancelOrder = async () => {
    if (!order) return
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/order/${orderId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        fetchOrderDetails()
      }
    } catch (err) {
      console.error('Failed to cancel order:', err)
    }
  }

  const handleReturnOrder = async () => {
    if (!order) return
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/order/${orderId}/return`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        fetchOrderDetails()
      }
    } catch (err) {
      console.error('Failed to return order:', err)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-muted-foreground">Loading order details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
              <Button onClick={onClose}>Close</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Delivery Tracking
          </CardTitle>
          <CardDescription>
            Track your order in real-time
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Order Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Order Status</h3>
              <Badge className={getStatusColor(order.status)}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(order.status)}
                  {getStatusText(order.status)}
                </div>
              </Badge>
            </div>
            
            <div className="text-sm space-y-1">
              <p><strong>Order ID:</strong> {order.id}</p>
              <p><strong>Estimated Delivery:</strong> {order.estimatedDeliveryTime}</p>
              <p><strong>Ordered:</strong> {new Date(order.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {/* Product Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Product Details</h3>
            <div className="flex items-start gap-3">
              {order.product.images && order.product.images[0] ? (
                <img 
                  src={order.product.images[0]} 
                  alt={order.product.title}
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                  📦
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-medium">{order.product.title}</h4>
                <p className="text-sm text-gray-600">Quantity: {order.quantity}</p>
                <p className="text-sm text-gray-600">Total: ${order.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Seller Info */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Seller Information
            </h3>
            <div className="text-sm space-y-1">
              <p><strong>Name:</strong> {order.seller.name}</p>
              <p className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <strong>Location:</strong> {order.seller.location.city}
              </p>
              <p className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <strong>Phone:</strong> {order.seller.phone}
              </p>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Delivery Information
            </h3>
            <div className="text-sm space-y-1">
              <p><strong>Address:</strong> {order.deliveryAddress}</p>
              <p><strong>Phone:</strong> {order.deliveryPhone}</p>
              {order.deliveryNotes && (
                <p><strong>Notes:</strong> {order.deliveryNotes}</p>
              )}
            </div>
          </div>

          {/* Delivery Person Info */}
          {order.deliveryPerson && (
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Delivery Person
              </h3>
              <div className="text-sm space-y-1">
                <p><strong>Name:</strong> {order.deliveryPerson.name}</p>
                <p className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <strong>Phone:</strong> {order.deliveryPerson.phone}
                </p>
                <p className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <strong>Last Location:</strong> {new Date(order.deliveryPerson.location.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {canCancel(order.status) && (
              <Button 
                onClick={handleCancelOrder}
                variant="outline"
                className="flex-1"
              >
                Cancel Order
              </Button>
            )}
            {canReturn(order.status) && (
              <Button 
                onClick={handleReturnOrder}
                variant="outline"
                className="flex-1"
              >
                Return Order
              </Button>
            )}
            {canRequestRefund(order.status, order.deliveredAt) && (
              <Button 
                onClick={() => setShowRefundRequest(true)}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Request Refund
              </Button>
            )}
            <Button onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Refund Request Modal */}
      {showRefundRequest && order && (
        <RefundRequest
          order={order}
          onClose={() => setShowRefundRequest(false)}
          onSuccess={() => {
            setShowRefundRequest(false)
            fetchOrderDetails()
          }}
        />
      )}
    </div>
  )
}
