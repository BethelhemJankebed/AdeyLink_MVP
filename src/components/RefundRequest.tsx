import React, { useState } from 'react'
import { useAuth } from './AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Clock, Package, AlertCircle, CheckCircle } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface Order {
  id: string
  productId: string
  sellerId: string
  buyerId: string
  quantity: number
  totalAmount: number
  status: string
  deliveredAt: string
  product: {
    title: string
    price: number
    images: string[]
  }
  seller: {
    name: string
    phone: string
  }
}

interface RefundRequestProps {
  order: Order
  onClose: () => void
  onSuccess: () => void
}

export function RefundRequest({ order, onClose, onSuccess }: RefundRequestProps) {
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    refundAmount: order.totalAmount,
    refundType: 'full'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, accessToken } = useAuth()

  const deliveredDate = new Date(order.deliveredAt)
  const currentDate = new Date()
  const daysSinceDelivery = Math.floor((currentDate.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24))
  const isWithinRefundPeriod = daysSinceDelivery <= 2

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!isWithinRefundPeriod) {
      setError('Refund request is only available within 2 days of delivery')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/refund-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            orderId: order.id,
            reason: formData.reason,
            description: formData.description,
            refundAmount: formData.refundAmount,
            refundType: formData.refundType,
            requestedAt: new Date().toISOString()
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit refund request')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to submit refund request')
    } finally {
      setLoading(false)
    }
  }

  const refundReasons = [
    'Product damaged during delivery',
    'Product not as described',
    'Wrong product received',
    'Product quality issues',
    'Changed mind',
    'Other'
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Refund Request
          </CardTitle>
          <CardDescription>
            Request a refund for your order within 2 days of delivery
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Order Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Order Information</h3>
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
                  <p className="text-sm text-gray-600">Seller: {order.seller.name}</p>
                </div>
              </div>
            </div>

            {/* Refund Policy Info */}
            <div className={`p-4 rounded-lg ${isWithinRefundPeriod ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                {isWithinRefundPeriod ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <h3 className={`font-medium ${isWithinRefundPeriod ? 'text-green-800' : 'text-red-800'}`}>
                  Refund Eligibility
                </h3>
              </div>
              <div className={`text-sm ${isWithinRefundPeriod ? 'text-green-700' : 'text-red-700'}`}>
                {isWithinRefundPeriod ? (
                  <div>
                    <p>✅ You are eligible for a refund</p>
                    <p>Delivered: {deliveredDate.toLocaleDateString()}</p>
                    <p>Days since delivery: {daysSinceDelivery} (within 2-day limit)</p>
                  </div>
                ) : (
                  <div>
                    <p>❌ Refund period has expired</p>
                    <p>Delivered: {deliveredDate.toLocaleDateString()}</p>
                    <p>Days since delivery: {daysSinceDelivery} (exceeds 2-day limit)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Refund Form */}
            {isWithinRefundPeriod && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Refund *</Label>
                  <Select
                    value={formData.reason}
                    onValueChange={(value) => setFormData({ ...formData, reason: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {refundReasons.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refundType">Refund Type *</Label>
                  <Select
                    value={formData.refundType}
                    onValueChange={(value) => setFormData({ ...formData, refundType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select refund type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Refund (${order.totalAmount.toFixed(2)})</SelectItem>
                      <SelectItem value="partial">Partial Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.refundType === 'partial' && (
                  <div className="space-y-2">
                    <Label htmlFor="refundAmount">Refund Amount *</Label>
                    <Input
                      id="refundAmount"
                      type="number"
                      min="0"
                      max={order.totalAmount}
                      step="0.01"
                      value={formData.refundAmount}
                      onChange={(e) => setFormData({ ...formData, refundAmount: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Additional Details</Label>
                  <Textarea
                    id="description"
                    placeholder="Please provide additional details about your refund request..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Refund Policy */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Refund Policy</h3>
              <ul className="text-sm space-y-1">
                <li>• Refunds are only available within 2 days of delivery</li>
                <li>• Full refunds are processed within 3-5 business days</li>
                <li>• Partial refunds may be subject to seller approval</li>
                <li>• Refunded items must be returned in original condition</li>
                <li>• Return shipping costs are covered by AdeyLink</li>
              </ul>
            </div>
          </CardContent>
          
          <CardFooter className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            {isWithinRefundPeriod && (
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Submitting...' : 'Submit Refund Request'}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
