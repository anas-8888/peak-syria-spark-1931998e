import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  // Fetch all orders
  const { data: orders = [] } = useQuery({
    queryKey: ["dashboard-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch products count
  const { data: productsCount = 0 } = useQuery({
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
  const { data: categories = [] } = useQuery({
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
  const { data: products = [] } = useQuery({
    queryKey: ["dashboard-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, category");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch recent orders with details
  const { data: recentOrdersData = [] } = useQuery({
    queryKey: ["dashboard-recent-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          total_amount,
          status,
          created_at,
          customer_name,
          profiles:user_id (full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(4);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate statistics
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const totalOrders = orders.length;
  
  // Calculate this month's data
  const now = new Date();
  const thisMonthOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
  });
  const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  
  // Calculate last month's data for comparison
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    return orderDate.getMonth() === lastMonth.getMonth() && orderDate.getFullYear() === lastMonth.getFullYear();
  });
  const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  
  // Calculate changes
  const revenueChange = lastMonthRevenue > 0 
    ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
    : "0";
  const ordersChange = lastMonthOrders.length > 0
    ? (((thisMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100).toFixed(1)
    : "0";
  const growthRate = revenueChange;

  // Prepare monthly data for charts (last 6 months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate.getMonth() === date.getMonth() && orderDate.getFullYear() === date.getFullYear();
    });
    const monthRevenue = monthOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    
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
      title: "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      unit: "",
      change: `${Number(revenueChange) >= 0 ? '+' : ''}${revenueChange}%`,
      trend: Number(revenueChange) >= 0 ? "up" : "down",
      icon: DollarSign,
    },
    {
      title: "New Orders",
      value: totalOrders.toString(),
      change: `${Number(ordersChange) >= 0 ? '+' : ''}${ordersChange}%`,
      trend: Number(ordersChange) >= 0 ? "up" : "down",
      icon: ShoppingBag,
    },
    {
      title: "Products",
      value: productsCount.toString(),
      change: "+0%",
      trend: "up",
      icon: Package,
    },
    {
      title: "Growth Rate",
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

  const recentOrders = recentOrdersData.map((order: any) => ({
    id: `#${order.id.slice(0, 8)}`,
    customer: order.customer_name || order.profiles?.full_name || 'Unknown',
    product: '-',
    amount: `$${Number(order.total_amount || 0).toFixed(2)}`,
    status: order.status || 'pending',
    statusColor: getStatusColor(order.status),
  }));
  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Overview</h1>
        <p className="text-sm md:text-base text-muted-foreground">Welcome to your PEAK Syria dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => {
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
                    <span className="text-xs text-muted-foreground">vs last month</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-xl">Revenue Trend (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-xl">Orders Trend (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="#3B82F6" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Second Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-xl">Products by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryDistribution.length > 0 ? (
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
                No category data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-xl">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.slice(-4).map((data, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-semibold text-sm md:text-base">{data.month}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">{data.orders} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary text-sm md:text-base">
                      ${data.revenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-xl">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            {recentOrders.map((order, index) => (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 md:p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                  <div className="h-10 w-10 md:h-12 md:w-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm md:text-base truncate">{order.customer}</p>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">{order.product}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-6">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-muted-foreground">Order ID</p>
                    <p className="font-semibold text-sm md:text-base">{order.id}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-semibold text-sm md:text-base">{order.amount}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${order.statusColor}`} />
                    <span className="text-xs md:text-sm font-medium whitespace-nowrap">{order.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Overview;
