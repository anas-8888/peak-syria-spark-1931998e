import { useState } from "react";
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react";
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
import productShoes1 from "@/assets/product-shoes-1.jpg";
import productShoes2 from "@/assets/product-shoes-2.jpg";
import productShoes3 from "@/assets/product-shoes-3.jpg";
import productApparel1 from "@/assets/product-apparel-1.jpg";

const products = [
  {
    id: 1,
    name: "Peak Basketball Pro X",
    category: "أحذية كرة السلة",
    price: "٢،٥٠٠،٠٠٠ ل.س",
    stock: 45,
    status: "متوفر",
    image: productShoes1,
  },
  {
    id: 2,
    name: "Peak Running Elite",
    category: "أحذية الجري",
    price: "١،٨٠٠،٠٠٠ ل.س",
    stock: 32,
    status: "متوفر",
    image: productShoes2,
  },
  {
    id: 3,
    name: "Peak Court Master",
    category: "أحذية كرة السلة",
    price: "٢،٢٠٠،٠٠٠ ل.س",
    stock: 8,
    status: "مخزون منخفض",
    image: productShoes3,
  },
  {
    id: 4,
    name: "Peak Training Shirt",
    category: "ملابس رياضية",
    price: "٨٥٠،٠٠٠ ل.س",
    stock: 0,
    status: "نفذ من المخزون",
    image: productApparel1,
  },
];

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">إدارة المنتجات</h1>
          <p className="text-muted-foreground">عرض وإدارة جميع المنتجات في المتجر</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة منتج جديد
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن منتج..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Button variant="outline">التصنيفات</Button>
            <Button variant="outline">الحالة</Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>المنتجات ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المنتج</TableHead>
                <TableHead className="text-right">التصنيف</TableHead>
                <TableHead className="text-right">السعر</TableHead>
                <TableHead className="text-right">المخزون</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="font-semibold">{product.price}</TableCell>
                  <TableCell>
                    <span
                      className={`font-medium ${
                        product.stock === 0
                          ? "text-destructive"
                          : product.stock < 10
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {product.stock} قطعة
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.status === "متوفر"
                          ? "default"
                          : product.status === "مخزون منخفض"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
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

export default Products;
