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
    customer: "Ahmad Mohammad",
    amount: "4,500,000 SYP",
    method: "Credit Card",
    status: "Completed",
    date: "2025/01/15",
  },
  {
    id: "TXN-12844",
    order: "#12844",
    customer: "Sara Ali",
    amount: "3,600,000 SYP",
    method: "Cash on Delivery",
    status: "Pending",
    date: "2025/01/14",
  },
  {
    id: "TXN-12843",
    order: "#12843",
    customer: "Mahmoud Khaled",
    amount: "2,200,000 SYP",
    method: "Credit Card",
    status: "Completed",
    date: "2025/01/14",
  },
  {
    id: "TXN-12842",
    order: "#12842",
    customer: "Layla Hassan",
    amount: "6,800,000 SYP",
    method: "Bank Transfer",
    status: "Completed",
    date: "2025/01/13",
  },
  {
    id: "TXN-12841",
    order: "#12841",
    customer: "Omar Yousef",
    amount: "3,200,000 SYP",
    method: "Credit Card",
    status: "Failed",
    date: "2025/01/12",
  },
];

const Payments = () => {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Payment Management</h1>
          <p className="text-muted-foreground">View and track all financial transactions</p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
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
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">450M SYP</p>
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
                <p className="text-sm text-muted-foreground">Revenue Growth</p>
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
                <p className="text-sm text-muted-foreground">Successful Transactions</p>
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
                <p className="text-sm text-muted-foreground">Pending Transactions</p>
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
            <CardTitle className="text-lg">Credit Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-2">285M SYP</p>
            <p className="text-sm text-muted-foreground">63% of total transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cash on Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-2">125M SYP</p>
            <p className="text-sm text-muted-foreground">28% of total transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bank Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-2">40M SYP</p>
            <p className="text-sm text-muted-foreground">9% of total transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
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
                        transaction.status === "Completed"
                          ? "default"
                          : transaction.status === "Pending"
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
