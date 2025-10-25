import React, { useState } from "react";
import { Button } from "./ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export function DemoDataButton() {
  const [loading, setLoading] = useState(false);

  const seedDemoData = async () => {
    setLoading(true);
    toast.info(
      "Demo data feature coming soon! For now, create seller accounts and add products manually."
    );

    // Future: This would call an API endpoint to seed demo data
    // For now, users should:
    // 1. Create multiple accounts as sellers
    // 2. Add products through each seller profile
    // 3. This simulates a real marketplace

    setTimeout(() => {
      setLoading(false);
      toast.success(
        "Tip: Sign up as a seller and add products to populate the marketplace!"
      );
    }, 2000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={seedDemoData}
      disabled={loading}
      className="border-purple-400 dark:border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
    >
      <Sparkles className="w-4 h-4 mr-2" />
      {loading ? "Loading..." : "Demo Mode Info"}
    </Button>
  );
}
