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
    category: "Basketball Shoes",
    price: "$45",
    stock: 45,
    status: "In Stock",
    image: productShoes1,
  },
  {
    id: 2,
    name: "Peak Running Elite",
    category: "Running Shoes",
    price: "$35",
    stock: 32,
    status: "In Stock",
    image: productShoes2,
  },
  {
    id: 3,
    name: "Peak Court Master",
    category: "Basketball Shoes",
    price: "$42",
    stock: 8,
    status: "Low Stock",
    image: productShoes3,
  },
  {
    id: 4,
    name: "Peak Training Shirt",
    category: "Apparel",
    price: "$18",
    stock: 0,
    status: "Out of Stock",
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
          <h1 className="text-3xl font-bold mb-2">Product Management</h1>
          <p className="text-muted-foreground">View and manage all products in the store</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Product
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for a product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">Categories</Button>
            <Button variant="outline">Status</Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
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
                      {product.stock} units
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.status === "In Stock"
                          ? "default"
                          : product.status === "Low Stock"
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
