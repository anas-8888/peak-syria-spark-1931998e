import { TrendingUp, DollarSign, ShoppingBag, Users, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

const CHART_COLORS = ["#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

const Analytics = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  // Fetch completed payments first
  const { data: completedPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["analytics-completed-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("order_id, amount, created_at")
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch orders that have completed payments
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["analytics-orders", completedPayments],
    queryFn: async () => {
      if (!completedPayments || completedPayments.length === 0) {
        return [];
      }

      const orderIds = completedPayments.map(p => p.order_id);
      
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          total_amount,
          status,
          created_at,
          order_items (
            quantity,
            price,
            product_id,
            products (
              name,
              category
            )
          )
        `)
        .in("id", orderIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!completedPayments,
  });

  // Fetch customer count
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["analytics-customers"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch categories for sales distribution
  const { data: categoriesData } = useQuery({
    queryKey: ["analytics-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("name");

      if (error) throw error;
      return data;
    },
  });

  const isLoading = ordersLoading || customersLoading || paymentsLoading;

  // Calculate metrics using only completed payments
  const totalRevenue = completedPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
  const totalOrders = ordersData?.length || 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate previous period for growth comparison - using completed payments
  const sixMonthsAgo = subMonths(new Date(), 6);
  
  // Filter completed payments by date
  const recentPayments = completedPayments?.filter(p => new Date(p.created_at) >= sixMonthsAgo) || [];
  const oldPayments = completedPayments?.filter(p => new Date(p.created_at) < sixMonthsAgo) || [];
  
  // Calculate revenue from completed payments
  const recentRevenue = recentPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const oldRevenue = oldPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const revenueGrowth = oldRevenue > 0 ? ((recentRevenue - oldRevenue) / oldRevenue) * 100 : 0;
  
  // Calculate orders growth from orders with completed payments
  const recentOrders = ordersData?.filter(o => new Date(o.created_at) >= sixMonthsAgo) || [];
  const oldOrders = ordersData?.filter(o => new Date(o.created_at) < sixMonthsAgo) || [];
  const ordersGrowth = oldOrders.length > 0 ? ((recentOrders.length - oldOrders.length) / oldOrders.length) * 100 : 0;

  // Monthly sales data for the last 6 months - using completed payments
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    // Get completed payments for this month
    const monthPayments = completedPayments?.filter(payment => {
      const paymentDate = new Date(payment.created_at);
      return paymentDate >= monthStart && paymentDate <= monthEnd;
    }) || [];

    // Get orders for this month (from completed payments)
    const monthOrderIds = monthPayments.map(p => p.order_id);
    const monthOrders = ordersData?.filter(order => 
      monthOrderIds.includes(order.id)
    ) || [];

    const revenue = monthPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

    return {
      month: format(date, "MMM"),
      revenue: revenue,
      orders: monthOrders.length,
    };
  });

  // Sales by category
  const categorySales = categoriesData?.map(cat => {
    const categoryOrders = ordersData?.flatMap(order => 
      order.order_items?.filter(item => item.products?.category === cat.name) || []
    ) || [];
    
    const totalSales = categoryOrders.reduce((sum, item) => 
      sum + (Number(item.price) * item.quantity), 0
    );

    return { name: cat.name, value: totalSales };
  }).filter(c => c.value > 0) || [];

  const totalCategorySales = categorySales.reduce((sum, c) => sum + c.value, 0);
  const categoryPercentages = categorySales.map((cat, index) => ({
    name: cat.name,
    value: totalCategorySales > 0 ? Math.round((cat.value / totalCategorySales) * 100) : 0,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  // Top selling products
  const productSalesMap = new Map<string, { name: string; sales: number; revenue: number }>();
  
  ordersData?.forEach(order => {
    order.order_items?.forEach(item => {
      const productName = item.products?.name || "Unknown";
      const existing = productSalesMap.get(productName) || { name: productName, sales: 0, revenue: 0 };
      productSalesMap.set(productName, {
        name: productName,
        sales: existing.sales + item.quantity,
        revenue: existing.revenue + (Number(item.price) * item.quantity),
      });
    });
  });

  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t("Analytics & Reports")}</h1>
          <p className="text-muted-foreground">{t("Detailed insights and performance metrics")}</p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          {t("Export Full Report")}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Revenue (6M)")}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">{formatPrice(recentRevenue)}</p>
                    <Badge variant="default" className="mt-1">
                      {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Total Orders")}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">{totalOrders.toLocaleString()}</p>
                    <Badge variant="secondary" className="mt-1">
                      {ordersGrowth >= 0 ? '+' : ''}{ordersGrowth.toFixed(1)}%
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Customers")}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">{customersData?.toLocaleString()}</p>
                    <Badge variant="secondary" className="mt-1">+12.4%</Badge>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Avg. Order Value")}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">{formatPrice(avgOrderValue)}</p>
                    <Badge variant="secondary" className="mt-1">+3.2%</Badge>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Revenue Trend (6 Months)")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatPrice(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#EF4444"
                    strokeWidth={2}
                    name={t("Revenue")}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Orders Trend (6 Months)")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orders" fill="#3B82F6" name={t("Orders")} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Sales by Category")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : categoryPercentages.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t("No category data available")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryPercentages}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryPercentages.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Top Selling Products")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              ) : topProducts.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {t("No product sales data available")}
                </div>
              ) : (
                topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sales} {t("units sold")}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-primary">{formatPrice(product.revenue)}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
