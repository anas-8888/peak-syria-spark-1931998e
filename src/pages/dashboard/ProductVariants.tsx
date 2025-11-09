import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductVariantManager from "@/components/ProductVariantManager";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function ProductVariants() {
  const { productId } = useParams<{ productId: string }>();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

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

  // Fetch product colors (color-image mappings)
  const { data: productColors = [] } = useQuery({
    queryKey: ['product-colors', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_colors')
        .select('color_id, image_id')
        .eq('product_id', productId);
      if (error) throw error;
      return data.map(pc => ({ color_id: pc.color_id, image_id: pc.image_id }));
    },
    enabled: !!productId,
  });


  if (!product) {
    return (
      <div className="p-8">
        <div className="text-center">{t("Product not found")}</div>
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
              {t("Back to Products")}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mt-4">{t("Manage Product Variants")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("Product")}: {product.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("Product Information")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t("Name")}</p>
            <p className="font-medium">{product.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("Category")}</p>
            <p className="font-medium">{product.category}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("Base Price")}</p>
            <p className="font-medium">{formatPrice(product.price)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("Stock")}</p>
            <p className="font-medium">{product.stock_quantity}</p>
          </div>
        </CardContent>
      </Card>

      {productId && product && (
        <ProductVariantManager 
          productId={productId}
          availableColors={productColors}
          availableSizes={product.sizes || []}
        />
      )}
    </div>
  );
}
