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
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Overview</h1>
        <p className="text-muted-foreground">Welcome to your PEAK Syria dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="hover:shadow-lg transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-3xl font-bold">
                    {stat.value}
                    {stat.unit && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        {stat.unit}
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={stat.trend === "up" ? "default" : "destructive"}
                      className="gap-1"
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

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order, index) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{order.customer}</p>
                    <p className="text-sm text-muted-foreground">{order.product}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="font-semibold">{order.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-semibold">{order.amount}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${order.statusColor}`} />
                    <span className="text-sm font-medium">{order.status}</span>
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
