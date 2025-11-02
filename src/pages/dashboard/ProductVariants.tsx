import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductVariantManager from "@/components/ProductVariantManager";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProductVariants() {
  const { productId } = useParams<{ productId: string }>();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8">
        <div className="text-center">Product not found</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/dashboard/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mt-4">Manage Product Variants</h1>
          <p className="text-muted-foreground mt-2">
            Product: {product.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{product.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Category</p>
            <p className="font-medium">{product.category}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Base Price</p>
            <p className="font-medium">${product.price}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Stock</p>
            <p className="font-medium">{product.stock_quantity}</p>
          </div>
        </CardContent>
      </Card>

      {productId && <ProductVariantManager productId={productId} />}
    </div>
  );
}
