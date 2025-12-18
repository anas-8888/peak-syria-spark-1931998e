import { useState } from "react";
import { TrendingUp, DollarSign, ShoppingBag, Users, Download, Calendar as CalendarIcon, Filter } from "lucide-react";
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
  Label,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, subDays, subMonths, subYears, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { exportToExcel } from "@/utils/exportToExcel";

const CHART_COLORS = ["#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

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

const Analytics = () => {
  const { t, isRTL } = useLanguage();
  const { formatPrice } = useCurrency();
  const [period, setPeriod] = useState<PeriodOption>("all");
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
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
  const filteredPayments = completedPayments?.filter(payment => {
    if (!filterStart || !filterEnd) return true;
    const paymentDate = new Date(payment.created_at);
    return paymentDate >= filterStart && paymentDate <= filterEnd;
  }) || [];

  // Filter orders by date range
  const filteredOrders = ordersData?.filter(order => {
    if (!filterStart || !filterEnd) return true;
    const orderDate = new Date(order.created_at);
    return orderDate >= filterStart && orderDate <= filterEnd;
  }) || [];

  // Calculate metrics using filtered data
  const totalRevenue = filteredPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate comparison period (previous period of same length)
  const getComparisonPeriod = (): { start: Date | null; end: Date | null } => {
    if (!filterStart || !filterEnd) {
      // Default to last 6 months vs previous 6 months
      const now = new Date();
      const sixMonthsAgo = subMonths(now, 6);
      const twelveMonthsAgo = subMonths(now, 12);
      return { start: twelveMonthsAgo, end: sixMonthsAgo };
    }
    
    const periodLength = filterEnd.getTime() - filterStart.getTime();
    const comparisonEnd = new Date(filterStart.getTime() - 1);
    const comparisonStart = new Date(comparisonEnd.getTime() - periodLength);
    
    return { start: comparisonStart, end: comparisonEnd };
  };

  const { start: comparisonStart, end: comparisonEnd } = getComparisonPeriod();

  // Calculate current period revenue
  const recentRevenue = filteredPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  
  // Calculate comparison period revenue
  const comparisonPayments = completedPayments?.filter(payment => {
    if (!comparisonStart || !comparisonEnd) return false;
    const paymentDate = new Date(payment.created_at);
    return paymentDate >= comparisonStart && paymentDate <= comparisonEnd;
  }) || [];
  const oldRevenue = comparisonPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  
  const revenueGrowth = oldRevenue > 0 ? ((recentRevenue - oldRevenue) / oldRevenue) * 100 : 0;
  
  // Calculate orders growth
  const recentOrders = filteredOrders;
  const comparisonOrderIds = comparisonPayments.map(p => p.order_id);
  const oldOrders = ordersData?.filter(order => comparisonOrderIds.includes(order.id)) || [];
  const ordersGrowth = oldOrders.length > 0 ? ((recentOrders.length - oldOrders.length) / oldOrders.length) * 100 : 0;

  // Prepare chart data based on period
  const getChartData = () => {
    if (!filterStart || !filterEnd) {
      // Default: last 6 months
      return Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
        const monthPayments = filteredPayments.filter(payment => {
          const paymentDate = new Date(payment.created_at);
          return paymentDate >= monthStart && paymentDate <= monthEnd;
        });

        const monthOrderIds = monthPayments.map(p => p.order_id);
        const monthOrders = filteredOrders.filter(order => monthOrderIds.includes(order.id));

        const revenue = monthPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

    return {
      month: format(date, "MMM"),
      revenue: revenue,
      orders: monthOrders.length,
    };
  });
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
        
        const dayRevenue = dayPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
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
        
        const weekRevenue = weekPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
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
        
        const monthRevenue = monthPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
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

  // Sales by category (using filtered orders)
  const categorySales = categoriesData?.map(cat => {
    const categoryOrders = filteredOrders.flatMap(order => 
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

  // Top selling products (using filtered orders)
  const productSalesMap = new Map<string, { name: string; sales: number; revenue: number }>();
  
  filteredOrders.forEach(order => {
    order.order_items?.forEach(item => {
      const productName = item.products?.name || t("Unknown");
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

  // Export to Excel function
  const handleExport = async () => {
    await exportToExcel({
      title: t("Analytics & Reports"),
      period,
      dateRange,
      stats: {
        totalRevenue: recentRevenue,
        totalOrders,
        avgOrderValue,
        revenueGrowth,
        ordersGrowth,
      },
      monthlyData: monthlyData.map(item => ({
        month: item.month,
        revenue: item.revenue,
        orders: item.orders,
      })),
      categoryData: categoryPercentages.map(cat => ({
        name: t(cat.name),
        value: categorySales.find(c => c.name === cat.name)?.value || 0,
        percentage: cat.value,
      })),
      topProducts: topProducts.map(product => ({
        name: product.name,
        sales: product.sales,
        revenue: product.revenue,
      })),
      formatPrice,
      t,
    });
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t("Analytics & Reports")}</h1>
          <p className="text-muted-foreground">{t("Detailed insights and performance metrics")}</p>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {period === "all" 
                    ? t("Total Revenue")
                    : period === "custom" && dateRange.from && dateRange.to
                    ? t("Revenue")
                    : period === "7days"
                    ? t("Revenue (7D)")
                    : period === "30days"
                    ? t("Revenue (30D)")
                    : period === "3months"
                    ? t("Revenue (3M)")
                    : period === "6months"
                    ? t("Revenue (6M)")
                    : period === "1year"
                    ? t("Revenue (1Y)")
                    : period === "2years"
                    ? t("Revenue (2Y)")
                    : t("Revenue")
                  }
                </p>
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
            <CardTitle>
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
            <CardTitle>
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
                <PieChart className={isRTL ? "rtl" : "ltr"}>
                  <Pie
                    data={categoryPercentages}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    activeIndex={activePieIndex ?? undefined}
                    activeShape={(props: any) => {
                      const { cx, cy } = props;
                      const entry = categoryPercentages[props.index];
                      if (!entry) return null;
                      return (
                        <g>
                          <text
                            x={cx}
                            y={cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{
                              fontSize: "14px",
                              fontWeight: "bold",
                              fill: "#fff",
                              textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                              direction: isRTL ? "rtl" : "ltr",
                            }}
                          >
                            <tspan x={cx} dy="-8" style={{ display: "block" }}>
                              {t(entry.name)}
                            </tspan>
                            <tspan x={cx} dy="16" style={{ display: "block" }}>
                              {entry.value}%
                            </tspan>
                          </text>
                        </g>
                      );
                    }}
                    onMouseEnter={(_, index) => setActivePieIndex(index)}
                    onMouseLeave={() => setActivePieIndex(null)}
                  >
                    {categoryPercentages.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    wrapperClassName={isRTL ? "rtl" : "ltr"}
                    contentStyle={{
                      direction: isRTL ? "rtl" : "ltr",
                      textAlign: isRTL ? "right" : "left",
                    }}
                    formatter={(value: number) => [`${value}%`, ""]}
                    labelFormatter={(label: string) => t(label)}
                  />
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
