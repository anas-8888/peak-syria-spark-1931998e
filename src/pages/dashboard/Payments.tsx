import { DollarSign, CreditCard, Banknote, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const transactions = [
  {
    id: "TXN-12845",
    order: "#12845",
    customer: "أحمد محمد",
    amount: "٤،٥٠٠،٠٠٠ ل.س",
    method: "بطاقة ائتمان",
    status: "مكتملة",
    date: "٢٠٢٥/٠١/١٥",
  },
  {
    id: "TXN-12844",
    order: "#12844",
    customer: "سارة علي",
    amount: "٣،٦٠٠،٠٠٠ ل.س",
    method: "نقداً عند التسليم",
    status: "معلقة",
    date: "٢٠٢٥/٠١/١٤",
  },
  {
    id: "TXN-12843",
    order: "#12843",
    customer: "محمود خالد",
    amount: "٢،٢٠٠،٠٠٠ ل.س",
    method: "بطاقة ائتمان",
    status: "مكتملة",
    date: "٢٠٢٥/٠١/١٤",
  },
  {
    id: "TXN-12842",
    order: "#12842",
    customer: "ليلى حسن",
    amount: "٦،٨٠٠،٠٠٠ ل.س",
    method: "تحويل بنكي",
    status: "مكتملة",
    date: "٢٠٢٥/٠١/١٣",
  },
  {
    id: "TXN-12841",
    order: "#12841",
    customer: "عمر يوسف",
    amount: "٣،٢٠٠،٠٠٠ ل.س",
    method: "بطاقة ائتمان",
    status: "مرفوضة",
    date: "٢٠٢٥/٠١/١٢",
  },
];

const Payments = () => {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">إدارة المدفوعات</h1>
          <p className="text-muted-foreground">عرض ومتابعة جميع المعاملات المالية</p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          تصدير التقرير
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
                <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold">٤٥٠ مليون</p>
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
                <p className="text-sm text-muted-foreground">نمو الإيرادات</p>
                <p className="text-2xl font-bold">+15.8%</p>
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
                <p className="text-sm text-muted-foreground">معاملات ناجحة</p>
                <p className="text-2xl font-bold">148</p>
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
                <p className="text-sm text-muted-foreground">معاملات معلقة</p>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">بطاقة ائتمان</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-2">٢٨٥ مليون</p>
            <p className="text-sm text-muted-foreground">63% من إجمالي المعاملات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">نقداً عند التسليم</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-2">١٢٥ مليون</p>
            <p className="text-sm text-muted-foreground">28% من إجمالي المعاملات</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">تحويل بنكي</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-2">٤٠ مليون</p>
            <p className="text-sm text-muted-foreground">9% من إجمالي المعاملات</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>المعاملات الأخيرة</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم المعاملة</TableHead>
                <TableHead className="text-right">رقم الطلب</TableHead>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">طريقة الدفع</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono font-semibold">{transaction.id}</TableCell>
                  <TableCell className="font-mono">{transaction.order}</TableCell>
                  <TableCell>{transaction.customer}</TableCell>
                  <TableCell className="font-semibold">{transaction.amount}</TableCell>
                  <TableCell>{transaction.method}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        transaction.status === "مكتملة"
                          ? "default"
                          : transaction.status === "معلقة"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{transaction.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payments;
