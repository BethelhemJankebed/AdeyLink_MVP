import React, { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { MapPin, Clock, Phone, Package, CheckCircle, Truck, User, DollarSign, TrendingUp } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface Order {
  id: string
  productId: string
  sellerId: string
  buyerId: string
  quantity: number
  totalAmount: number
  deliveryAddress: string
  deliveryPhone: string
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
  createdAt: string
  estimatedDeliveryTime: string
  product: {
    title: string
    price: number
  }
  seller: {
    name: string
    phone: string
    location: { city: string; lat: number; lng: number }
  }
  buyer: {
    name: string
    phone: string
  }
  deliveryPerson?: {
    name: string
    phone: string
    location: { lat: number; lng: number; timestamp: string }
  }
}

interface AdminDashboardProps {
  onClose: () => void
}

export function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    activeDeliveries: 0
  })
  const { user, accessToken } = useAuth()

  useEffect(() => {
    // Check if user is admin
    if (!user || user.email !== 'admin@adeylink.com') {
      setError('Access denied. Admin privileges required.')
      setLoading(false)
      return
    }
    
    fetchOrders()
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/admin/orders`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const ordersData = await response.json()
        setOrders(ordersData)
        
        // Calculate stats
        const totalOrders = ordersData.length
        const pendingOrders = ordersData.filter((o: Order) => ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(o.status)).length
        const completedOrders = ordersData.filter((o: Order) => o.status === 'delivered').length
        const totalRevenue = ordersData.filter((o: Order) => o.status === 'delivered').reduce((sum: number, o: Order) => sum + o.totalAmount, 0)
        const activeDeliveries = ordersData.filter((o: Order) => o.status === 'out_for_delivery').length
        
        setStats({
          totalOrders,
          pendingOrders,
          completedOrders,
          totalRevenue,
          activeDeliveries
        })
      } else {
        setError('Failed to fetch orders')
      }
    } catch (err) {
      setError('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/admin/order/${orderId}/status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ status })
        }
      )

      if (response.ok) {
        fetchOrders()
      }
    } catch (err) {
      console.error('Failed to update order status:', err)
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'confirmed': return 'Confirmed'
      case 'preparing': return 'Preparing'
      case 'out_for_delivery': return 'Out for Delivery'
      case 'delivered': return 'Delivered'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-muted-foreground">Loading admin dashboard...</p>
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
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Admin Dashboard
          </CardTitle>
          <CardDescription>
            Monitor deliveries, payments, and platform activity
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.completedOrders}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.activeDeliveries}</p>
                    <p className="text-sm text-muted-foreground">Active Deliveries</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Management */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="delivery">Out for Delivery</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-medium">{order.product.title}</h3>
                          <p className="text-sm text-muted-foreground">Order #{order.id}</p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p><strong>Seller:</strong> {order.seller.name}</p>
                          <p><strong>Buyer:</strong> {order.buyer.name}</p>
                        </div>
                        <div>
                          <p><strong>Amount:</strong> ${order.totalAmount.toFixed(2)}</p>
                          <p><strong>Quantity:</strong> {order.quantity}</p>
                        </div>
                        <div>
                          <p><strong>Delivery:</strong> {order.deliveryAddress}</p>
                          <p><strong>Phone:</strong> {order.deliveryPhone}</p>
                        </div>
                      </div>

                      {order.deliveryPerson && (
                        <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Delivery Person
                          </h4>
                          <div className="text-sm space-y-1">
                            <p><strong>Name:</strong> {order.deliveryPerson.name}</p>
                            <p><strong>Phone:</strong> {order.deliveryPerson.phone}</p>
                            <p><strong>Last Location:</strong> {new Date(order.deliveryPerson.location.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        {order.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          >
                            Confirm Order
                          </Button>
                        )}
                        {order.status === 'confirmed' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                          >
                            Start Preparing
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                          >
                            Out for Delivery
                          </Button>
                        )}
                        {order.status === 'out_for_delivery' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                          >
                            Mark Delivered
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pending" className="mt-6">
              <div className="space-y-4">
                {orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).map((order) => (
                  <Card key={order.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-medium">{order.product.title}</h3>
                          <p className="text-sm text-muted-foreground">Order #{order.id}</p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Seller:</strong> {order.seller.name}</p>
                          <p><strong>Buyer:</strong> {order.buyer.name}</p>
                        </div>
                        <div>
                          <p><strong>Amount:</strong> ${order.totalAmount.toFixed(2)}</p>
                          <p><strong>Delivery:</strong> {order.deliveryAddress}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        {order.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          >
                            Confirm Order
                          </Button>
                        )}
                        {order.status === 'confirmed' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                          >
                            Start Preparing
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                          >
                            Out for Delivery
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="delivery" className="mt-6">
              <div className="space-y-4">
                {orders.filter(o => o.status === 'out_for_delivery').map((order) => (
                  <Card key={order.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-medium">{order.product.title}</h3>
                          <p className="text-sm text-muted-foreground">Order #{order.id}</p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Seller:</strong> {order.seller.name}</p>
                          <p><strong>Buyer:</strong> {order.buyer.name}</p>
                        </div>
                        <div>
                          <p><strong>Amount:</strong> ${order.totalAmount.toFixed(2)}</p>
                          <p><strong>Delivery:</strong> {order.deliveryAddress}</p>
                        </div>
                      </div>

                      {order.deliveryPerson && (
                        <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Delivery Person Location
                          </h4>
                          <div className="text-sm space-y-1">
                            <p><strong>Name:</strong> {order.deliveryPerson.name}</p>
                            <p><strong>Phone:</strong> {order.deliveryPerson.phone}</p>
                            <p><strong>Last Update:</strong> {new Date(order.deliveryPerson.location.timestamp).toLocaleString()}</p>
                            <p><strong>Coordinates:</strong> {order.deliveryPerson.location.lat.toFixed(4)}, {order.deliveryPerson.location.lng.toFixed(4)}</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4">
                        <Button 
                          size="sm" 
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                        >
                          Mark Delivered
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              <div className="space-y-4">
                {orders.filter(o => o.status === 'delivered').map((order) => (
                  <Card key={order.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-medium">{order.product.title}</h3>
                          <p className="text-sm text-muted-foreground">Order #{order.id}</p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Seller:</strong> {order.seller.name}</p>
                          <p><strong>Buyer:</strong> {order.buyer.name}</p>
                        </div>
                        <div>
                          <p><strong>Amount:</strong> ${order.totalAmount.toFixed(2)}</p>
                          <p><strong>Delivered:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button onClick={onClose}>Close Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
