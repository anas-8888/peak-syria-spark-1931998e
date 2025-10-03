import { useState } from "react";
import { Search, Plus, Edit, Trash2, Tag, TrendingUp, Percent, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const discounts = [
  {
    id: 1,
    code: "SUMMER25",
    type: "Percentage",
    value: "25%",
    minOrder: "2,000,000 SYP",
    uses: 142,
    limit: 500,
    status: "Active",
    startDate: "2025/01/01",
    endDate: "2025/03/31",
  },
  {
    id: 2,
    code: "NEWCUSTOMER",
    type: "Fixed Amount",
    value: "500,000 SYP",
    minOrder: "1,000,000 SYP",
    uses: 89,
    limit: 200,
    status: "Active",
    startDate: "2025/01/01",
    endDate: "2025/12/31",
  },
  {
    id: 3,
    code: "FREESHIP",
    type: "Free Shipping",
    value: "Free",
    minOrder: "1,500,000 SYP",
    uses: 256,
    limit: 1000,
    status: "Active",
    startDate: "2025/01/01",
    endDate: "2025/06/30",
  },
  {
    id: 4,
    code: "WINTER20",
    type: "Percentage",
    value: "20%",
    minOrder: "1,800,000 SYP",
    uses: 340,
    limit: 500,
    status: "Expired",
    startDate: "2024/12/01",
    endDate: "2024/12/31",
  },
  {
    id: 5,
    code: "VIP15",
    type: "Percentage",
    value: "15%",
    minOrder: "No minimum",
    uses: 45,
    limit: 100,
    status: "Active",
    startDate: "2025/01/01",
    endDate: "2025/12/31",
  },
];

const Discounts = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDiscounts = discounts.filter((discount) =>
    discount.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Discount Codes</h1>
          <p className="text-muted-foreground">Create and manage discount codes and promotions</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Discount
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Tag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Codes</p>
                <p className="text-2xl font-bold">24</p>
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
                <p className="text-sm text-muted-foreground">Total Uses</p>
                <p className="text-2xl font-bold">872</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Percent className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Discount</p>
                <p className="text-2xl font-bold">18%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unique Users</p>
                <p className="text-2xl font-bold">648</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by discount code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Discounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Discount Codes ({filteredDiscounts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Min. Order</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDiscounts.map((discount) => (
                <TableRow key={discount.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <span className="font-mono font-bold">{discount.code}</span>
                    </div>
                  </TableCell>
                  <TableCell>{discount.type}</TableCell>
                  <TableCell className="font-semibold text-primary">{discount.value}</TableCell>
                  <TableCell>{discount.minOrder}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {discount.uses} / {discount.limit}
                      </p>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(discount.uses / discount.limit) * 100}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={discount.status === "Active" ? "default" : "destructive"}
                    >
                      {discount.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{discount.endDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Discounts;
