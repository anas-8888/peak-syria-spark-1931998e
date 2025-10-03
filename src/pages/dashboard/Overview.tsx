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

const stats = [
  {
    title: "Total Revenue",
    value: "450,000,000",
    unit: "SYP",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: "New Orders",
    value: "156",
    change: "+8.2%",
    trend: "up",
    icon: ShoppingBag,
  },
  {
    title: "Products",
    value: "342",
    change: "+2.4%",
    trend: "up",
    icon: Package,
  },
  {
    title: "Growth Rate",
    value: "15.8%",
    change: "-2.1%",
    trend: "down",
    icon: TrendingUp,
  },
];

const revenueData = [
  { month: "Jan", revenue: 45000000, orders: 142 },
  { month: "Feb", revenue: 52000000, orders: 168 },
  { month: "Mar", revenue: 48000000, orders: 156 },
  { month: "Apr", revenue: 61000000, orders: 189 },
  { month: "May", revenue: 55000000, orders: 172 },
  { month: "Jun", revenue: 70000000, orders: 215 },
];

const categoryData = [
  { name: "Basketball Shoes", value: 45, color: "#EF4444" },
  { name: "Running Shoes", value: 30, color: "#3B82F6" },
  { name: "Apparel", value: 15, color: "#10B981" },
  { name: "Accessories", value: 10, color: "#F59E0B" },
];

const recentOrders = [
  {
    id: "#12845",
    customer: "Ahmad Mohammad",
    product: "Peak Basketball Pro X",
    amount: "2,500,000 SYP",
    status: "Delivered",
    statusColor: "bg-green-500",
  },
  {
    id: "#12844",
    customer: "Sara Ali",
    product: "Peak Running Elite",
    amount: "1,800,000 SYP",
    status: "In Transit",
    statusColor: "bg-blue-500",
  },
  {
    id: "#12843",
    customer: "Mahmoud Khaled",
    product: "Peak Court Master",
    amount: "2,200,000 SYP",
    status: "Processing",
    statusColor: "bg-yellow-500",
  },
  {
    id: "#12842",
    customer: "Layla Hassan",
    product: "Peak Speed Runner",
    amount: "1,900,000 SYP",
    status: "Delivered",
    statusColor: "bg-green-500",
  },
];

const Overview = () => {
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
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="Revenue (SYP)"
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
              <BarChart data={revenueData}>
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
            <CardTitle className="text-base md:text-xl">Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-xl">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueData.slice(-4).map((data, index) => (
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
                      {(data.revenue / 1000000).toFixed(1)}M SYP
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
