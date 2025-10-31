import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { X, Package, Truck, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusConfig = {
  pending: {
    icon: Clock,
    label: "Processing",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    textColor: "text-yellow-700 dark:text-yellow-400",
  },
  processing: {
    icon: Package,
    label: "Processing",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    textColor: "text-blue-700 dark:text-blue-400",
  },
  shipped: {
    icon: Truck,
    label: "Shipped",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    textColor: "text-purple-700 dark:text-purple-400",
  },
  delivered: {
    icon: CheckCircle,
    label: "Delivered",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    textColor: "text-green-700 dark:text-green-400",
  },
};

export const OrderStatusBanner = () => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Fetch user's latest order that hasn't been confirmed as received
  const { data: latestOrder } = useQuery({
    queryKey: ["latest-order", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, customer_confirmed_receipt, created_at, total_amount")
        .eq("user_id", user.id)
        .eq("customer_confirmed_receipt", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Reset dismissed state when order changes
  useEffect(() => {
    setDismissed(false);
  }, [latestOrder?.id]);

  // Don't show if user not logged in, no order, order confirmed, cancelled, or dismissed
  if (!user || !latestOrder || latestOrder.customer_confirmed_receipt || latestOrder.status === "cancelled" || dismissed) {
    return null;
  }

  const config = statusConfig[latestOrder.status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className={`sticky top-0 z-50 w-full border-b ${config.borderColor} ${config.bgColor}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`flex-shrink-0 p-2 rounded-full ${config.bgColor}`}>
              <Icon className={`h-5 w-5 ${config.textColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold ${config.textColor} text-sm sm:text-base`}>
                Your order is {config.label}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                Order #{latestOrder.id.slice(0, 8)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/order-tracking?orderId=${latestOrder.id}`}>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                Track Order
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="h-8 w-8 p-0 hover:bg-background/50"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
