import { DollarSign, CreditCard, Banknote, TrendingUp, Download, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useState } from "react";

type Payment = {
  id: string;
  order_id: string;
  customer_name: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
};

const Payments = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const queryClient = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  // Fetch all payments
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ paymentId, status }: { paymentId: string; status: string }) => {
      const { error } = await supabase
        .from("payments")
        .update({ status })
        .eq("id", paymentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success(t("Payment status updated successfully"));
      setEditDialogOpen(false);
    },
    onError: () => {
      toast.error(t("Failed to update payment status"));
    },
  });

  const payments = paymentsData || [];

  // Calculate statistics
  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const completedPayments = payments.filter(p => p.status === 'completed');
  const pendingPayments = payments.filter(p => p.status === 'pending');
  
  // Calculate revenue growth (comparing last month vs previous month)
  const now = new Date();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);

  const lastMonthRevenue = payments
    .filter(p => {
      const date = new Date(p.created_at);
      return date >= lastMonthStart && date <= lastMonthEnd;
    })
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const prevMonthRevenue = payments
    .filter(p => {
      const date = new Date(p.created_at);
      return date >= prevMonthStart && date <= prevMonthEnd;
    })
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const revenueGrowth = prevMonthRevenue > 0
    ? ((lastMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
    : 0;

  // Calculate payment method breakdown
  const paymentMethodStats = payments.reduce((acc, payment) => {
    const method = payment.payment_method;
    if (!acc[method]) {
      acc[method] = { total: 0, count: 0 };
    }
    acc[method].total += Number(payment.amount);
    acc[method].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const totalPayments = payments.length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t("Payment Management")}</h1>
          <p className="text-muted-foreground">{t("View and track all financial transactions")}</p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          {t("Export Report")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Total Revenue")}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Revenue Growth")}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold">
                    {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Successful Transactions")}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold">{completedPayments.length}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Banknote className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Pending Transactions")}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold">{pendingPayments.length}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-24 mb-2" />
                <Skeleton className="h-4 w-40" />
              </CardContent>
            </Card>
          ))
        ) : (
          Object.entries(paymentMethodStats).map(([method, stats]) => (
            <Card key={method}>
              <CardHeader>
                <CardTitle className="text-lg">{method}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-2">{formatPrice(stats.total)}</p>
                <p className="text-sm text-muted-foreground">
                  {totalPayments > 0 
                    ? Math.round((stats.count / totalPayments) * 100) 
                    : 0}% {t("of total transactions")}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("Recent Transactions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Transaction ID")}</TableHead>
                <TableHead>{t("Order ID")}</TableHead>
                <TableHead>{t("Customer")}</TableHead>
                <TableHead>{t("Amount")}</TableHead>
                <TableHead>{t("Payment Method")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead>{t("Date")}</TableHead>
                <TableHead>{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {t("No payments found")}
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono font-semibold">
                      TXN-{payment.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="font-mono">
                      #{payment.order_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>{payment.customer_name}</TableCell>
                    <TableCell className="font-semibold">
                      {formatPrice(Number(payment.amount))}
                    </TableCell>
                    <TableCell>{payment.payment_method}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payment.status === "completed"
                            ? "default"
                            : payment.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {payment.status === "completed" ? t("Completed") :
                         payment.status === "pending" ? t("Pending") :
                         payment.status === "failed" ? t("Failed") :
                         payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(payment.created_at), "yyyy/MM/dd")}</TableCell>
                    <TableCell>
                      {payment.payment_method.toLowerCase().includes("cash") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setNewStatus(payment.status);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Payment Status Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Update Payment Status")}</DialogTitle>
            <DialogDescription>
              {t("Change the payment status for this Cash on Delivery order")}
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t("Order ID")}: #{selectedPayment.order_id.slice(0, 8)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("Customer")}: {selectedPayment.customer_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("Amount")}: {formatPrice(Number(selectedPayment.amount))}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("Payment Status")}</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t("Pending")}</SelectItem>
                    <SelectItem value="completed">{t("Completed")}</SelectItem>
                    <SelectItem value="failed">{t("Failed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (selectedPayment) {
                      updateStatusMutation.mutate({
                        paymentId: selectedPayment.id,
                        status: newStatus,
                      });
                    }
                  }}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? t("Updating...") : t("Update Status")}
                </Button>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  {t("Cancel")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payments;
