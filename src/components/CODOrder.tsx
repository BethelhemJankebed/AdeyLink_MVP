import React, { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Clock, MapPin, Phone, User } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
}

interface Seller {
  id: string;
  name: string;
  location: { city: string; lat: number; lng: number };
  phone: string;
}

interface CODOrderProps {
  product: Product;
  seller: Seller;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export function CODOrder({
  product,
  seller,
  onClose,
  onSuccess,
}: CODOrderProps) {
  const [formData, setFormData] = useState({
    quantity: 1,
    deliveryAddress: "",
    deliveryPhone: "",
    deliveryNotes: "",
    preferredDeliveryTime: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [estimatedDelivery, setEstimatedDelivery] = useState<string | null>(
    null
  );
  const { user, accessToken } = useAuth();

  const calculateDeliveryTime = () => {
    // Simple delivery time calculation based on distance
    // In a real app, this would use actual distance calculation
    const baseTime = 30; // 30 minutes base
    const randomDelay = Math.floor(Math.random() * 60); // 0-60 minutes random delay
    const totalMinutes = baseTime + randomDelay;

    const deliveryTime = new Date();
    deliveryTime.setMinutes(deliveryTime.getMinutes() + totalMinutes);

    return deliveryTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const deliveryTime = calculateDeliveryTime();
      setEstimatedDelivery(deliveryTime);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/cod-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            productId: product.id,
            sellerId: seller.id,
            buyerId: user?.id,
            quantity: formData.quantity,
            totalAmount: product.price * formData.quantity,
            deliveryAddress: formData.deliveryAddress,
            deliveryPhone: formData.deliveryPhone,
            deliveryNotes: formData.deliveryNotes,
            preferredDeliveryTime: formData.preferredDeliveryTime,
            estimatedDeliveryTime: deliveryTime,
            status: "pending",
          }),
        }
      );

      // parse response safely in case server returns non-JSON text
      let data: any = null;
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        data = { raw: text };
      }

      if (!response.ok) {
        const msg =
          (data && (data.error || data.message)) ||
          data.raw ||
          "Failed to place order";
        throw new Error(msg);
      }

      // Also create an admin-facing order record (best-effort)
      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/orders`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              products: [
                {
                  productId: product.id,
                  sellerId: seller.id,
                  quantity: formData.quantity,
                },
              ],
              total: product.price * formData.quantity,
              paymentMethod: "cod",
            }),
          }
        );
      } catch (notifyErr) {
        // log but don't block the happy path
        console.error("Failed to create admin order record:", notifyErr);
      }

      // Show confirmation to the user
      try {
        const orderId = data.orderId || data.id || null;
        toast.success(
          orderId
            ? `Order placed — confirmation (#${orderId})`
            : "Order placed — confirmation sent"
        );
        onSuccess(orderId || "");
      } catch (tErr) {
        // ignore toast errors but still call onSuccess if available
        onSuccess((data && (data.orderId || data.id)) || "");
      }
    } catch (err: any) {
      setError(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = product.price * formData.quantity;

  return (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Cash on Delivery Order
          </CardTitle>
          <CardDescription>
            Place your order and pay when the delivery person arrives
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* scrollable content area; footer stays visible below */}
          <div className="flex-1 overflow-y-auto">
            <CardContent className="space-y-6 p-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Product Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Order Details</h3>
                <div className="flex items-start gap-3">
                  {product.images && product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                      📦
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">{product.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {product.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium">
                        ${product.price.toFixed(2)} each
                      </span>
                      <Badge variant="outline">COD Available</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seller Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Seller Information
                </h3>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Name:</strong> {seller.name}
                  </p>
                  <p className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <strong>Location:</strong> {seller.location.city}
                  </p>
                  <p className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <strong>Phone:</strong> {seller.phone}
                  </p>
                </div>
              </div>

              {/* Order Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                  <Textarea
                    id="deliveryAddress"
                    placeholder="Enter your complete delivery address..."
                    value={formData.deliveryAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryAddress: e.target.value,
                      })
                    }
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryPhone">Delivery Phone Number *</Label>
                  <Input
                    id="deliveryPhone"
                    type="tel"
                    placeholder="+251912345678"
                    value={formData.deliveryPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryPhone: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredDeliveryTime">
                    Preferred Delivery Time
                  </Label>
                  <Input
                    id="preferredDeliveryTime"
                    type="datetime-local"
                    value={formData.preferredDeliveryTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferredDeliveryTime: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryNotes">
                    Delivery Notes (Optional)
                  </Label>
                  <Textarea
                    id="deliveryNotes"
                    placeholder="Any special instructions for delivery..."
                    value={formData.deliveryNotes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryNotes: e.target.value,
                      })
                    }
                    rows={2}
                  />
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Order Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Product Price:</span>
                    <span>
                      ${product.price.toFixed(2)} × {formData.quantity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between font-medium text-lg border-t pt-2">
                    <span>Total Amount:</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* COD Information */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">
                  Cash on Delivery Information
                </h3>
                <ul className="text-sm space-y-1">
                  <li>• Pay only when your order arrives</li>
                  <li>• No upfront payment required</li>
                  <li>• Delivery person will contact you before arrival</li>
                  <li>• You can track your delivery in real-time</li>
                  <li>• 2-day return policy available</li>
                </ul>
              </div>

              {estimatedDelivery && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Estimated Delivery Time
                  </h3>
                  <p className="text-lg font-medium text-blue-700">
                    Your order will arrive by {estimatedDelivery}
                  </p>
                </div>
              )}
            </CardContent>
          </div>

          <CardFooter className="flex gap-3 border-t border-border bg-card z-10">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !formData.deliveryAddress.trim() ||
                !formData.deliveryPhone.trim() ||
                formData.quantity < 1
              }
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? "Placing Order..." : "Place COD Order"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
