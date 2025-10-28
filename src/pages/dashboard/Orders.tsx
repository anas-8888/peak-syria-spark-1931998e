import { useState } from "react";
import { Search, Eye, Package, Truck, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

type OrderWithItems = {
  id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  itemCount: number;
};

const statusIcons = {
  delivered: CheckCircle,
  shipped: Truck,
  pending: Package,
  cancelled: XCircle,
};

const statusVariants = {
  delivered: "default",
  shipped: "secondary",
  pending: "secondary",
  cancelled: "destructive",
};

const statusLabels = {
  delivered: "Delivered",
  shipped: "In Transit",
  pending: "Processing",
  cancelled: "Cancelled",
};

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          id,
          customer_name,
          customer_email,
          total_amount,
          status,
          created_at,
          order_items (
            id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return orders.map((order) => ({
        ...order,
        itemCount: order.order_items?.length || 0,
      })) as OrderWithItems[];
    },
  });

  const orders = ordersData || [];

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalOrders = orders.length;
  const inTransitOrders = orders.filter((o) => o.status === "shipped").length;
  const completedOrders = orders.filter((o) => o.status === "delivered").length;
  const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Order Management</h1>
        <p className="text-muted-foreground">View and track all orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : totalOrders}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Transit</p>
                <p className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : inTransitOrders}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : completedOrders}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : cancelledOrders}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const StatusIcon = statusIcons[order.status as keyof typeof statusIcons];
                  return (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono font-semibold">
                        #{order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{order.itemCount} items</TableCell>
                      <TableCell className="font-semibold">
                        ${order.total_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[order.status as keyof typeof statusVariants] as any} className="gap-2">
                          <StatusIcon className="h-3 w-3" />
                          {statusLabels[order.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(order.created_at), "yyyy/MM/dd")}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;
