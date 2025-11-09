import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

const Overview = () => {
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  // Fetch completed payments first
  const { data: completedPayments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["dashboard-completed-payments"],
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
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["dashboard-orders", completedPayments],
    queryFn: async () => {
      if (!completedPayments || completedPayments.length === 0) {
        return [];
      }

      const orderIds = completedPayments.map(p => p.order_id);
      
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .in("id", orderIds)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!completedPayments,
  });

  // Fetch products count
  const { data: productsCount = 0, isLoading: productsCountLoading } = useQuery({
    queryKey: ["dashboard-products-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch categories for pie chart
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["dashboard-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch products with categories for distribution
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["dashboard-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, category");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch recent orders with details (only orders with completed payments)
  const { data: recentOrdersData = [], isLoading: recentOrdersLoading } = useQuery({
    queryKey: ["dashboard-recent-orders", completedPayments],
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
          customer_name,
          customer_email,
          order_items (
            id,
            quantity,
            products (
              name
            )
          )
        `)
        .in("id", orderIds)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!completedPayments,
  });

  // Calculate statistics using only completed payments
  const totalRevenue = completedPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const totalOrders = orders.length;
  
  // Calculate this month's data - using completed payments
  const now = new Date();
  const thisMonthPayments = completedPayments.filter(payment => {
    const paymentDate = new Date(payment.created_at);
    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
  });
  const thisMonthRevenue = thisMonthPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  
  // Get orders for this month (from completed payments)
  const thisMonthOrderIds = thisMonthPayments.map(p => p.order_id);
  const thisMonthOrders = orders.filter(order => thisMonthOrderIds.includes(order.id));
  
  // Calculate last month's data for comparison - using completed payments
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthPayments = completedPayments.filter(payment => {
    const paymentDate = new Date(payment.created_at);
    return paymentDate.getMonth() === lastMonth.getMonth() && paymentDate.getFullYear() === lastMonth.getFullYear();
  });
  const lastMonthRevenue = lastMonthPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  
  // Get orders for last month (from completed payments)
  const lastMonthOrderIds = lastMonthPayments.map(p => p.order_id);
  const lastMonthOrders = orders.filter(order => lastMonthOrderIds.includes(order.id));
  
  // Calculate changes
  const revenueChange = lastMonthRevenue > 0 
    ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
    : "0";
  const ordersChange = lastMonthOrders.length > 0
    ? (((thisMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100).toFixed(1)
    : "0";
  const growthRate = revenueChange;

  // Prepare monthly data for charts (last 6 months) - using completed payments
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    // Get completed payments for this month
    const monthPayments = completedPayments.filter(payment => {
      const paymentDate = new Date(payment.created_at);
      return paymentDate >= monthStart && paymentDate <= monthEnd;
    });
    
    const monthRevenue = monthPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    
    // Get orders for this month (from completed payments)
    const monthOrderIds = monthPayments.map(p => p.order_id);
    const monthOrders = orders.filter(order => monthOrderIds.includes(order.id));
    
    monthlyData.push({
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      revenue: monthRevenue,
      orders: monthOrders.length,
    });
  }

  // Prepare category distribution data
  const categoryColors = ["#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];
  const categoryDistribution = categories.map((cat, index) => {
    const catProducts = products.filter(p => p.category === cat.name);
    const percentage = products.length > 0 ? ((catProducts.length / products.length) * 100).toFixed(1) : 0;
    return {
      name: cat.name,
      value: parseFloat(percentage as string),
      color: categoryColors[index % categoryColors.length],
    };
  }).filter(cat => cat.value > 0);

  // Prepare stats
  const stats = [
    {
      title: t("Total Revenue"),
      value: formatPrice(totalRevenue),
      unit: "",
      change: `${Number(revenueChange) >= 0 ? '+' : ''}${revenueChange}%`,
      trend: Number(revenueChange) >= 0 ? "up" : "down",
      icon: DollarSign,
    },
    {
      title: t("New Orders"),
      value: totalOrders.toString(),
      change: `${Number(ordersChange) >= 0 ? '+' : ''}${ordersChange}%`,
      trend: Number(ordersChange) >= 0 ? "up" : "down",
      icon: ShoppingBag,
    },
    {
      title: t("Products"),
      value: productsCount.toString(),
      change: "+0%",
      trend: "up",
      icon: Package,
    },
    {
      title: t("Growth Rate"),
      value: `${growthRate}%`,
      change: `${Number(revenueChange) >= 0 ? '+' : ''}${revenueChange}%`,
      trend: Number(growthRate) >= 0 ? "up" : "down",
      icon: TrendingUp,
    },
  ];

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'pending':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const isLoading = paymentsLoading || ordersLoading || productsCountLoading || categoriesLoading || productsLoading || recentOrdersLoading;

  const recentOrders = recentOrdersData.map((order: any) => {
    const productNames = order.order_items?.map((item: any) => item.products?.name).filter(Boolean) || [];
    const productSummary = productNames.length > 0 
      ? `${productNames[0]}${productNames.length > 1 ? ` +${productNames.length - 1} ${t("more")}` : ''}`
      : t('No items');
    
    return {
      id: `#${order.id.slice(0, 8)}`,
      customer: order.customer_name || order.customer_email || 'Unknown',
      product: productSummary,
      amount: formatPrice(Number(order.total_amount || 0)),
      status: order.status || 'pending',
      statusColor: getStatusColor(order.status),
      date: new Date(order.created_at).toLocaleDateString(),
    };
  });
  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("Overview")}</h1>
        <p className="text-sm md:text-base text-muted-foreground">{t("Welcome to your PEAK Syria dashboard")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-32" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className="hover:shadow-lg transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className="h-8 w-8 md:h-10 md:w-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-xl md:text-3xl font-bold">
                      {stat.value}
                      {stat.unit && (
                        <span className="text-xs md:text-sm font-normal text-muted-foreground ml-1 md:ml-2">
                          {stat.unit}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={stat.trend === "up" ? "default" : "destructive"}
                        className="gap-1 text-xs"
                      >
                        {stat.trend === "up" ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {stat.change}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{t("vs last month")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-xl">{t("Revenue Trend (6 Months)")}</CardTitle>
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
                  <Tooltip 
                    formatter={(value: number) => formatPrice(value)}
                  />
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
            <CardTitle className="text-base md:text-xl">{t("Orders Trend (6 Months)")}</CardTitle>
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

      {/* Second Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-xl">{t("Products by Category")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t("No category data available")}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-xl">{t("Recent Activity")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {monthlyData.slice(-4).map((data, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-semibold text-sm md:text-base">{data.month}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">{data.orders} {t("orders")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary text-sm md:text-base">
                        {formatPrice(data.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-xl">{t("Recent Orders")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-3 p-4 rounded-lg border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Skeleton className="h-3 w-16 ml-auto" />
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t("No orders yet")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order, index) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{order.customer}</p>
                        <p className="text-xs text-muted-foreground truncate">{order.product}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={order.status === 'delivered' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'}
                      className="gap-1"
                    >
                      <div className={`h-2 w-2 rounded-full ${order.statusColor}`} />
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">{t("Order ID")}</p>
                        <p className="font-mono font-semibold">{order.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("Date")}</p>
                        <p className="font-medium">{order.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{t("Amount")}</p>
                      <p className="font-semibold text-primary">{order.amount}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Overview;
