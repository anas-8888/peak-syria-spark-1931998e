import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Trash2, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';

interface ProductVariantManagerProps {
  productId: string;
}

interface Variant {
  id?: string;
  color_id: string;
  color_name?: string;
  size: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
}

export default function ProductVariantManager({ productId }: ProductVariantManagerProps) {
  const queryClient = useQueryClient();
  const [unifiedPricing, setUnifiedPricing] = useState(false);
  const [unifiedPrice, setUnifiedPrice] = useState<number>(0);
  const [variants, setVariants] = useState<Variant[]>([]);

  // Fetch product details
  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      if (error) throw error;
      setUnifiedPricing(data.unified_pricing || false);
      return data;
    },
  });

  // Fetch colors
  const { data: colors } = useQuery({
    queryKey: ['colors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('colors')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing variants
  const { data: existingVariants, isLoading } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          *,
          colors (name)
        `)
        .eq('product_id', productId);
      if (error) throw error;
      const formattedVariants = data.map(v => ({
        id: v.id,
        color_id: v.color_id,
        color_name: v.colors?.name,
        size: v.size,
        price: v.price,
        stock_quantity: v.stock_quantity,
        is_active: v.is_active,
      }));
      setVariants(formattedVariants);
      return data;
    },
  });

  // Save variants mutation
  const saveVariantsMutation = useMutation({
    mutationFn: async () => {
      // Update product unified_pricing flag
      await supabase
        .from('products')
        .update({ unified_pricing: unifiedPricing })
        .eq('id', productId);

      // Delete existing variants
      await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', productId);

      // Insert new variants
      const variantsToInsert = variants.map(v => ({
        product_id: productId,
        color_id: v.color_id,
        size: v.size,
        price: unifiedPricing ? unifiedPrice : v.price,
        stock_quantity: v.stock_quantity,
        is_active: v.is_active,
      }));

      const { error } = await supabase
        .from('product_variants')
        .insert(variantsToInsert);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Variants saved successfully');
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
    onError: (error) => {
      toast.error('Failed to save variants: ' + error.message);
    },
  });

  const addVariant = () => {
    setVariants([...variants, {
      color_id: colors?.[0]?.id || '',
      size: '',
      price: unifiedPrice,
      stock_quantity: 0,
      is_active: true,
    }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  if (isLoading) return <div>Loading variants...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Variants (Color & Size)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Unified Pricing Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="unified-pricing" className="text-base">
              Use Single Price for All Variants
            </Label>
            <p className="text-sm text-muted-foreground">
              Apply one price to all color and size combinations
            </p>
          </div>
          <Switch
            id="unified-pricing"
            checked={unifiedPricing}
            onCheckedChange={setUnifiedPricing}
          />
        </div>

        {/* Unified Price Input */}
        {unifiedPricing && (
          <div className="space-y-2">
            <Label htmlFor="unified-price">Unified Price</Label>
            <Input
              id="unified-price"
              type="number"
              step="0.01"
              value={unifiedPrice}
              onChange={(e) => setUnifiedPrice(parseFloat(e.target.value) || 0)}
              placeholder="Enter price for all variants"
            />
          </div>
        )}

        {/* Variants List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Variants</Label>
            <Button onClick={addVariant} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Variant
            </Button>
          </div>

          {variants.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No variants added yet. Click "Add Variant" to start.
            </p>
          )}

          {variants.map((variant, index) => (
            <div key={index} className="flex gap-3 items-start p-4 border rounded-lg">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
                {/* Color */}
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Select
                    value={variant.color_id}
                    onValueChange={(value) => updateVariant(index, 'color_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {colors?.map((color) => (
                        <SelectItem key={color.id} value={color.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: color.hex_code }}
                            />
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Size */}
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Input
                    value={variant.size}
                    onChange={(e) => updateVariant(index, 'size', e.target.value)}
                    placeholder="e.g., 40, M, XL"
                  />
                </div>

                {/* Price */}
                {!unifiedPricing && (
                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={variant.price}
                      onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                )}

                {/* Stock */}
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    value={variant.stock_quantity}
                    onChange={(e) => updateVariant(index, 'stock_quantity', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                {/* Active Toggle */}
                <div className="space-y-2">
                  <Label>Active</Label>
                  <Switch
                    checked={variant.is_active}
                    onCheckedChange={(checked) => updateVariant(index, 'is_active', checked)}
                  />
                </div>
              </div>

              {/* Delete Button */}
              <Button
                variant="destructive"
                size="icon"
                onClick={() => removeVariant(index)}
                className="mt-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Summary */}
        {variants.length > 0 && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h4 className="font-medium">Summary</h4>
            <p className="text-sm text-muted-foreground">
              Total variants: {variants.length}
            </p>
            {!unifiedPricing && product?.min_price && product?.max_price && (
              <p className="text-sm text-muted-foreground">
                Price range: ${product.min_price} - ${product.max_price}
              </p>
            )}
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={() => saveVariantsMutation.mutate()}
          disabled={saveVariantsMutation.isPending || variants.length === 0}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {saveVariantsMutation.isPending ? 'Saving...' : 'Save All Variants'}
        </Button>
      </CardContent>
    </Card>
  );
}
