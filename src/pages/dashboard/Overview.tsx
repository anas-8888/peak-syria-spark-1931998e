import { useState } from "react";
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
  Calendar as CalendarIcon,
  Filter,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from "date-fns";
import { exportToExcel } from "@/utils/exportToExcel";
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

type DateRange = {
  from: Date | null;
  to: Date | null;
};

type PeriodOption = 
  | "7days" 
  | "30days" 
  | "3months" 
  | "6months" 
  | "1year" 
  | "2years" 
  | "all" 
  | "custom";

const Overview = () => {
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const [period, setPeriod] = useState<PeriodOption>("all");
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
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

  // Calculate date range based on selected period
  const getDateRange = (): { start: Date | null; end: Date | null } => {
    const now = new Date();
    const end = endOfDay(now);
    
    switch (period) {
      case "7days":
        return { start: startOfDay(subDays(now, 7)), end };
      case "30days":
        return { start: startOfDay(subDays(now, 30)), end };
      case "3months":
        return { start: startOfDay(subMonths(now, 3)), end };
      case "6months":
        return { start: startOfDay(subMonths(now, 6)), end };
      case "1year":
        return { start: startOfDay(subYears(now, 1)), end };
      case "2years":
        return { start: startOfDay(subYears(now, 2)), end };
      case "custom":
        return { 
          start: dateRange.from ? startOfDay(dateRange.from) : null, 
          end: dateRange.to ? endOfDay(dateRange.to) : null 
        };
      case "all":
      default:
        return { start: null, end: null };
    }
  };

  const { start: filterStart, end: filterEnd } = getDateRange();

  // Filter completed payments by date range
  const filteredPayments = completedPayments.filter(payment => {
    if (!filterStart || !filterEnd) return true;
    const paymentDate = new Date(payment.created_at);
    return paymentDate >= filterStart && paymentDate <= filterEnd;
  });

  // Filter orders by date range
  const filteredOrders = orders.filter(order => {
    if (!filterStart || !filterEnd) return true;
    const orderDate = new Date(order.created_at);
    return orderDate >= filterStart && orderDate <= filterEnd;
  });

  // Calculate statistics using filtered data
  const totalRevenue = filteredPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const totalOrders = filteredOrders.length;
  
  // Calculate comparison period (previous period of same length)
  const getComparisonPeriod = (): { start: Date | null; end: Date | null } => {
    if (!filterStart || !filterEnd) {
      // Default to last month vs this month
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: lastMonthStart, end: lastMonthEnd };
    }
    
    const periodLength = filterEnd.getTime() - filterStart.getTime();
    const comparisonEnd = new Date(filterStart.getTime() - 1);
    const comparisonStart = new Date(comparisonEnd.getTime() - periodLength);
    
    return { start: comparisonStart, end: comparisonEnd };
  };

  const { start: comparisonStart, end: comparisonEnd } = getComparisonPeriod();

  // Calculate current period data
  const thisPeriodPayments = filteredPayments;
  const thisPeriodRevenue = thisPeriodPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const thisPeriodOrders = filteredOrders;

  // Calculate comparison period data
  const comparisonPayments = completedPayments.filter(payment => {
    if (!comparisonStart || !comparisonEnd) return false;
    const paymentDate = new Date(payment.created_at);
    return paymentDate >= comparisonStart && paymentDate <= comparisonEnd;
  });
  const comparisonRevenue = comparisonPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const comparisonOrderIds = comparisonPayments.map(p => p.order_id);
  const comparisonOrders = orders.filter(order => comparisonOrderIds.includes(order.id));
  
  // Calculate changes
  const revenueChange = comparisonRevenue > 0 
    ? (((thisPeriodRevenue - comparisonRevenue) / comparisonRevenue) * 100).toFixed(1)
    : "0";
  const ordersChange = comparisonOrders.length > 0
    ? (((thisPeriodOrders.length - comparisonOrders.length) / comparisonOrders.length) * 100).toFixed(1)
    : "0";
  const growthRate = revenueChange;

  // Prepare chart data based on period
  const getChartData = () => {
    if (!filterStart || !filterEnd) {
      // Default: last 6 months
      const monthlyData = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthPayments = filteredPayments.filter(payment => {
          const paymentDate = new Date(payment.created_at);
          return paymentDate >= monthStart && paymentDate <= monthEnd;
        });
        
        const monthRevenue = monthPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        const monthOrderIds = monthPayments.map(p => p.order_id);
        const monthOrders = filteredOrders.filter(order => monthOrderIds.includes(order.id));
        
        monthlyData.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          revenue: monthRevenue,
          orders: monthOrders.length,
        });
      }
      return monthlyData;
    }

    // For custom ranges, group by appropriate interval
    const daysDiff = Math.ceil((filterEnd.getTime() - filterStart.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 30) {
      // Daily grouping for periods <= 30 days
      const dailyData = [];
      const currentDate = new Date(filterStart);
      while (currentDate <= filterEnd) {
        const dayStart = startOfDay(currentDate);
        const dayEnd = endOfDay(currentDate);
        
        const dayPayments = filteredPayments.filter(payment => {
          const paymentDate = new Date(payment.created_at);
          return paymentDate >= dayStart && paymentDate <= dayEnd;
        });
        
        const dayRevenue = dayPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        const dayOrderIds = dayPayments.map(p => p.order_id);
        const dayOrders = filteredOrders.filter(order => dayOrderIds.includes(order.id));
        
        dailyData.push({
          month: format(currentDate, 'MMM dd'),
          revenue: dayRevenue,
          orders: dayOrders.length,
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dailyData;
    } else if (daysDiff <= 365) {
      // Weekly grouping for periods <= 1 year
      const weeklyData = [];
      const currentDate = new Date(filterStart);
      while (currentDate <= filterEnd) {
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const actualWeekEnd = weekEnd > filterEnd ? filterEnd : weekEnd;
        
        const weekPayments = filteredPayments.filter(payment => {
          const paymentDate = new Date(payment.created_at);
          return paymentDate >= currentDate && paymentDate <= actualWeekEnd;
        });
        
        const weekRevenue = weekPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        const weekOrderIds = weekPayments.map(p => p.order_id);
        const weekOrders = filteredOrders.filter(order => weekOrderIds.includes(order.id));
        
        weeklyData.push({
          month: `${format(currentDate, 'MMM dd')} - ${format(actualWeekEnd, 'MMM dd')}`,
          revenue: weekRevenue,
          orders: weekOrders.length,
        });
        
        currentDate.setDate(currentDate.getDate() + 7);
      }
      return weeklyData;
    } else {
      // Monthly grouping for periods > 1 year
      const monthlyData = [];
      const currentDate = new Date(filterStart.getFullYear(), filterStart.getMonth(), 1);
      while (currentDate <= filterEnd) {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const actualMonthEnd = monthEnd > filterEnd ? filterEnd : monthEnd;
        
        const monthPayments = filteredPayments.filter(payment => {
          const paymentDate = new Date(payment.created_at);
          return paymentDate >= monthStart && paymentDate <= actualMonthEnd;
        });
        
        const monthRevenue = monthPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        const monthOrderIds = monthPayments.map(p => p.order_id);
        const monthOrders = filteredOrders.filter(order => monthOrderIds.includes(order.id));
        
        monthlyData.push({
          month: format(currentDate, 'MMM yyyy'),
          revenue: monthRevenue,
          orders: monthOrders.length,
        });
        
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      return monthlyData;
    }
  };

  const monthlyData = getChartData();

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

  // Translate order status
  const translateStatus = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return t('Pending');
      case 'processing':
        return t('Processing');
      case 'delivered':
        return t('Delivered');
      case 'cancelled':
        return t('Cancelled');
      case 'shipped':
        return t('Shipped');
      default:
        return status;
    }
  };

  const isLoading = paymentsLoading || ordersLoading || productsCountLoading || categoriesLoading || productsLoading || recentOrdersLoading;

  // Filter recent orders by date range
  const filteredRecentOrdersData = recentOrdersData.filter((order: any) => {
    if (!filterStart || !filterEnd) return true;
    const orderDate = new Date(order.created_at);
    return orderDate >= filterStart && orderDate <= filterEnd;
  });

  const recentOrders = filteredRecentOrdersData.map((order: any) => {
    const productNames = order.order_items?.map((item: any) => item.products?.name).filter(Boolean) || [];
    const productSummary = productNames.length > 0 
      ? `${productNames[0]}${productNames.length > 1 ? ` +${productNames.length - 1} ${t("more")}` : ''}`
      : t('No items');
    
    return {
      id: `#${order.id.slice(0, 8)}`,
      customer: order.customer_name || order.customer_email || t('Unknown'),
      product: productSummary,
      amount: formatPrice(Number(order.total_amount || 0)),
      status: order.status || 'pending',
      statusTranslated: translateStatus(order.status || 'pending'),
      statusColor: getStatusColor(order.status),
      date: new Date(order.created_at).toLocaleDateString(),
    };
  });

  // Export to Excel function
  const handleExport = async () => {
    const categoryData = categoryDistribution.map(cat => ({
      name: t(cat.name),
      value: 0, // We don't have sales value, only percentage
      percentage: cat.value
    }));

    await exportToExcel({
      title: t("Overview Report"),
      period,
      dateRange,
      stats: {
        totalRevenue,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        revenueGrowth: parseFloat(revenueChange),
        ordersGrowth: parseFloat(ordersChange),
      },
      monthlyData: monthlyData.map(item => ({
        month: item.month,
        revenue: item.revenue,
        orders: item.orders,
      })),
      categoryData: categoryData.length > 0 ? categoryData : undefined,
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        customer: order.customer,
        product: order.product,
        amount: order.amount,
        status: order.statusTranslated,
        date: order.date,
      })),
      formatPrice,
      t,
    });
  };
  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("Overview")}</h1>
          <p className="text-sm md:text-base text-muted-foreground">{t("Welcome to your PEAK Syria dashboard")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(value) => setPeriod(value as PeriodOption)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t("Select Period")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">{t("Last 7 Days")}</SelectItem>
              <SelectItem value="30days">{t("Last 30 Days")}</SelectItem>
              <SelectItem value="3months">{t("Last 3 Months")}</SelectItem>
              <SelectItem value="6months">{t("Last 6 Months")}</SelectItem>
              <SelectItem value="1year">{t("Last Year")}</SelectItem>
              <SelectItem value="2years">{t("Last 2 Years")}</SelectItem>
              <SelectItem value="all">{t("All Time")}</SelectItem>
              <SelectItem value="custom">{t("Custom Range")}</SelectItem>
            </SelectContent>
          </Select>
          {period === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>{t("Pick a date range")}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from || new Date()}
                  selected={{ from: dateRange.from || undefined, to: dateRange.to || undefined }}
                  onSelect={(range) => {
                    setDateRange({
                      from: range?.from || null,
                      to: range?.to || null,
                    });
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            {t("Export Full Report")}
          </Button>
        </div>
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
                      <span className="text-xs text-muted-foreground">{t("vs previous period")}</span>
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
            <CardTitle className="text-base md:text-xl">
              {period === "all" 
                ? t("Revenue Trend (All Time)")
                : period === "custom" && dateRange.from && dateRange.to
                ? t("Revenue Trend")
                : period === "7days"
                ? t("Revenue Trend (7 Days)")
                : period === "30days"
                ? t("Revenue Trend (30 Days)")
                : period === "3months"
                ? t("Revenue Trend (3 Months)")
                : period === "6months"
                ? t("Revenue Trend (6 Months)")
                : period === "1year"
                ? t("Revenue Trend (1 Year)")
                : period === "2years"
                ? t("Revenue Trend (2 Years)")
                : t("Revenue Trend")
              }
            </CardTitle>
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
            <CardTitle className="text-base md:text-xl">
              {period === "all" 
                ? t("Orders Trend (All Time)")
                : period === "custom" && dateRange.from && dateRange.to
                ? t("Orders Trend")
                : period === "7days"
                ? t("Orders Trend (7 Days)")
                : period === "30days"
                ? t("Orders Trend (30 Days)")
                : period === "3months"
                ? t("Orders Trend (3 Months)")
                : period === "6months"
                ? t("Orders Trend (6 Months)")
                : period === "1year"
                ? t("Orders Trend (1 Year)")
                : period === "2years"
                ? t("Orders Trend (2 Years)")
                : t("Orders Trend")
              }
            </CardTitle>
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
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, payload: any) => {
                      if (payload && payload[0]) {
                        return [`${value}%`, t(payload[0].payload.name)];
                      }
                      return [`${value}%`, ""];
                    }}
                    labelFormatter={(label: string) => ""}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold">{t(data.name)}</p>
                            <p className="text-sm text-muted-foreground">{data.value}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
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
                      {order.statusTranslated}
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
