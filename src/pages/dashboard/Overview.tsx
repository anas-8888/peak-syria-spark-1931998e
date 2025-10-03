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
    title: "إجمالي المبيعات",
    value: "٤٥٠،٠٠٠،٠٠٠",
    unit: "ل.س",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: "الطلبات الجديدة",
    value: "156",
    change: "+8.2%",
    trend: "up",
    icon: ShoppingBag,
  },
  {
    title: "المنتجات",
    value: "342",
    change: "+2.4%",
    trend: "up",
    icon: Package,
  },
  {
    title: "معدل النمو",
    value: "15.8%",
    change: "-2.1%",
    trend: "down",
    icon: TrendingUp,
  },
];

const recentOrders = [
  {
    id: "#12845",
    customer: "أحمد محمد",
    product: "Peak Basketball Pro X",
    amount: "٢،٥٠٠،٠٠٠ ل.س",
    status: "تم التسليم",
    statusColor: "bg-green-500",
  },
  {
    id: "#12844",
    customer: "سارة علي",
    product: "Peak Running Elite",
    amount: "١،٨٠٠،٠٠٠ ل.س",
    status: "قيد التوصيل",
    statusColor: "bg-blue-500",
  },
  {
    id: "#12843",
    customer: "محمود خالد",
    product: "Peak Court Master",
    amount: "٢،٢٠٠،٠٠٠ ل.س",
    status: "قيد المعالجة",
    statusColor: "bg-yellow-500",
  },
  {
    id: "#12842",
    customer: "ليلى حسن",
    product: "Peak Speed Runner",
    amount: "١،٩٠٠،٠٠٠ ل.س",
    status: "تم التسليم",
    statusColor: "bg-green-500",
  },
];

const Overview = () => {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">نظرة عامة</h1>
        <p className="text-muted-foreground">مرحباً بك في لوحة التحكم الخاصة بـ PEAK Syria</p>
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
                      <span className="text-sm font-normal text-muted-foreground mr-2">
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
                    <span className="text-xs text-muted-foreground">عن الشهر الماضي</span>
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
          <CardTitle className="text-xl">الطلبات الأخيرة</CardTitle>
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
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">رقم الطلب</p>
                    <p className="font-semibold">{order.id}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">المبلغ</p>
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
