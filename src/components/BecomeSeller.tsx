import React, { useState } from "react";
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
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface BecomeSellerProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function BecomeSeller({ onClose, onSuccess }: BecomeSellerProps) {
  const [formData, setFormData] = useState({
    businessName: "",
    businessDescription: "",
    businessCategory: "",
    businessPhone: "",
    businessAddress: "",
    businessLicense: "",
    bankAccount: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, accessToken } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-75c53d23/become-seller`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            userId: user?.id,
            businessName: formData.businessName,
            businessDescription: formData.businessDescription,
            businessCategory: formData.businessCategory,
            businessPhone: formData.businessPhone,
            businessAddress: formData.businessAddress,
            businessLicense: formData.businessLicense,
            bankAccount: formData.bankAccount,
          }),
        }
      );

      // parse response safely: some server responses may return plain text or non-JSON
      let data: any = null;
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        data = { raw: text };
      }

      if (!response.ok) {
        // prefer a helpful message from parsed JSON if available
        const msg =
          (data && (data.error || data.message)) ||
          data.raw ||
          "Failed to become a seller";
        throw new Error(msg);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to become a seller");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Become a Seller</CardTitle>
          <CardDescription>
            Complete your seller profile to start selling on AdeyLink
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  placeholder="Your Business Name"
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessCategory">Business Category *</Label>
                <Input
                  id="businessCategory"
                  placeholder="e.g., Flowers, Food Catering, Handcrafts"
                  value={formData.businessCategory}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessCategory: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessDescription">
                Business Description *
              </Label>
              <Textarea
                id="businessDescription"
                placeholder="Describe your business and what you sell..."
                value={formData.businessDescription}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    businessDescription: e.target.value,
                  })
                }
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessPhone">Business Phone *</Label>
                <Input
                  id="businessPhone"
                  type="tel"
                  placeholder="+251912345678"
                  value={formData.businessPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, businessPhone: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessAddress">Business Address *</Label>
                <Input
                  id="businessAddress"
                  placeholder="Your business address"
                  value={formData.businessAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessAddress: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessLicense">
                  Business License (Optional)
                </Label>
                <Input
                  id="businessLicense"
                  placeholder="License number if applicable"
                  value={formData.businessLicense}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessLicense: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccount">Bank Account (Optional)</Label>
                <Input
                  id="bankAccount"
                  placeholder="Account number for payments"
                  value={formData.bankAccount}
                  onChange={(e) =>
                    setFormData({ ...formData, bankAccount: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">
                Seller Benefits
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• List unlimited products</li>
                <li>• Create product videos</li>
                <li>• Receive direct messages from buyers</li>
                <li>• Track your sales and analytics</li>
                <li>• Get matched with complementary sellers</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Processing..." : "Become a Seller"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
