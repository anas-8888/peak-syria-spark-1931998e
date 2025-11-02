import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
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
  availableColors: { color_id: string; image_id: string | null }[];
  availableSizes: string[];
  onSave?: () => void;
}

export interface ProductVariantManagerHandle {
  saveVariants: () => Promise<void>;
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

const ProductVariantManager = forwardRef<ProductVariantManagerHandle, ProductVariantManagerProps>(({ 
  productId, 
  availableColors, 
  availableSizes,
  onSave 
}, ref) => {
  const queryClient = useQueryClient();
  const [unifiedPricing, setUnifiedPricing] = useState(false);
  const [unifiedPrice, setUnifiedPrice] = useState<number>(0);
  const [unifiedStock, setUnifiedStock] = useState<number>(0);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [mainPrice, setMainPrice] = useState<number>(0);
  const [totalStock, setTotalStock] = useState<number>(0);

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
      setMainPrice(data.price || 0);
      setTotalStock(data.stock_quantity || 0);
      return data;
    },
  });

  // Fetch color details for the available colors
  const { data: colors } = useQuery({
    queryKey: ['colors', availableColors],
    queryFn: async () => {
      if (availableColors.length === 0) return [];
      const colorIds = availableColors.map(c => c.color_id);
      const { data, error } = await supabase
        .from('colors')
        .select('*')
        .in('id', colorIds)
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data;
    },
    enabled: availableColors.length > 0,
  });

  // Fetch existing variants
  const { data: existingVariants, isLoading } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          *,
          colors (name, hex_code)
        `)
        .eq('product_id', productId);
      if (error) throw error;
      return data;
    },
  });

  // Set variants when data is loaded and colors are available
  useEffect(() => {
    if (!unifiedPricing && existingVariants && existingVariants.length > 0 && colors && colors.length > 0) {
      const formattedVariants = existingVariants.map(v => ({
        id: v.id,
        color_id: v.color_id,
        color_name: v.colors?.name,
        size: v.size,
        price: v.price,
        stock_quantity: v.stock_quantity,
        is_active: v.is_active,
      }));
      setVariants(formattedVariants);
    }
  }, [existingVariants, colors, unifiedPricing]);

  // Auto-generate variants when unified pricing changes or colors/sizes change
  const generateVariants = () => {
    if (!unifiedPricing || !colors || colors.length === 0 || availableSizes.length === 0) return;
    
    const newVariants: Variant[] = [];
    colors.forEach(color => {
      availableSizes.forEach(size => {
        newVariants.push({
          color_id: color.id,
          color_name: color.name,
          size: size,
          price: mainPrice,
          stock_quantity: Math.floor(totalStock / (colors.length * availableSizes.length)),
          is_active: true,
        });
      });
    });
    setVariants(newVariants);
  };

  // Note: Total stock is managed independently from variants
  // Each variant has its own stock, and the total stock is the sum of all variant stocks

  // Save variants mutation
  const saveVariantsMutation = useMutation({
    mutationFn: async () => {
      // Validate that we have data to save
      if (!mainPrice || mainPrice <= 0) {
        throw new Error('Please enter a valid main price');
      }
      
      if (!totalStock || totalStock < 0) {
        throw new Error('Please enter a valid total stock');
      }

      // Auto-generate variants if using unified pricing
      let variantsToSave = variants;
      if (unifiedPricing && colors && colors.length > 0 && availableSizes.length > 0) {
        variantsToSave = [];
        const stockPerVariant = Math.floor(totalStock / (colors.length * availableSizes.length));
        const extraStock = totalStock % (colors.length * availableSizes.length);
        let extraStockDistributed = 0;
        
        colors.forEach(color => {
          availableSizes.forEach(size => {
            const stock = stockPerVariant + (extraStockDistributed < extraStock ? 1 : 0);
            extraStockDistributed++;
            variantsToSave.push({
              color_id: color.id,
              size: size,
              price: mainPrice,
              stock_quantity: stock,
              is_active: true,
            });
          });
        });
      } else if (!unifiedPricing && colors && colors.length > 0 && availableSizes.length > 0) {
        // Manual variant mode - check for remaining stock
        const manualStock = variants.reduce((sum, v) => sum + v.stock_quantity, 0);
        const remainingStock = totalStock - manualStock;

        if (remainingStock < 0) {
          throw new Error(`Manual variants total stock (${manualStock}) exceeds product total stock (${totalStock}). Please adjust variant stocks.`);
        }

        // Get all possible color-size combinations
        const allCombinations: Array<{ color_id: string; size: string }> = [];
        colors.forEach(color => {
          availableSizes.forEach(size => {
            allCombinations.push({ color_id: color.id, size });
          });
        });

        // Find used combinations
        const usedCombinations = new Set(
          variants.map(v => `${v.color_id}-${v.size}`)
        );

        // Get available combinations (not used yet)
        const availableCombinations = allCombinations.filter(
          combo => !usedCombinations.has(`${combo.color_id}-${combo.size}`)
        );

        // If there's remaining stock, we need available combinations to distribute it
        if (remainingStock > 0 && availableCombinations.length === 0) {
          throw new Error(
            `You have ${remainingStock} units of remaining stock but no available color-size combinations left. ` +
            `Total possible combinations: ${allCombinations.length}, Already used: ${variants.length}. ` +
            `Please either increase manual variant stocks to match total stock (${totalStock}), ` +
            `reduce total stock to ${manualStock}, or add more color/size options to the product.`
          );
        }

        // Add manual variants to the list
        variantsToSave = [...variants];

        // Distribute remaining stock across available combinations
        if (remainingStock > 0 && availableCombinations.length > 0) {
          const stockPerVariant = Math.floor(remainingStock / availableCombinations.length);
          const extraStock = remainingStock % availableCombinations.length;

          availableCombinations.forEach((combo, index) => {
            variantsToSave.push({
              color_id: combo.color_id,
              size: combo.size,
              price: mainPrice,
              stock_quantity: stockPerVariant + (index < extraStock ? 1 : 0),
              is_active: true,
            });
          });
        }
      }

      // Update product with main price, total stock, and unified_pricing flag
      await supabase
        .from('products')
        .update({ 
          unified_pricing: unifiedPricing,
          price: mainPrice,
          stock_quantity: totalStock
        })
        .eq('id', productId);

      // Delete existing variants
      await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', productId);

      // Insert new variants
      if (variantsToSave.length > 0) {
        const variantsToInsert = variantsToSave.map(v => ({
          product_id: productId,
          color_id: v.color_id,
          size: v.size,
          price: v.price,
          stock_quantity: v.stock_quantity,
          is_active: v.is_active,
        }));

        const { error } = await supabase
          .from('product_variants')
          .insert(variantsToInsert);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Variants saved successfully');
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      if (onSave) onSave();
    },
    onError: (error) => {
      toast.error('Failed to save variants: ' + error.message);
    },
  });

  const addVariant = () => {
    // Find the first available color that doesn't have all sizes used
    const availableColor = colors?.find(color => {
      const usedSizesForColor = variants.filter(v => v.color_id === color.id).map(v => v.size);
      return usedSizesForColor.length < availableSizes.length;
    });

    setVariants([...variants, {
      color_id: availableColor?.id || colors?.[0]?.id || '',
      size: '',
      price: mainPrice,
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

  // Expose save function to parent component
  useImperativeHandle(ref, () => ({
    saveVariants: async () => {
      await saveVariantsMutation.mutateAsync();
    }
  }));

  if (isLoading) return <div>Loading variants...</div>;

  return (
    <div className="space-y-6">
      {/* Main Price and Total Stock - Always shown */}
      <Card>
        <CardHeader>
          <CardTitle>Base Product Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="main-price">Main Price (USD) *</Label>
              <Input
                id="main-price"
                type="number"
                step="0.01"
                value={mainPrice}
                onChange={(e) => setMainPrice(parseFloat(e.target.value) || 0)}
                placeholder="Enter main price"
              />
              <p className="text-xs text-muted-foreground">
                Used for variants not explicitly added below
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="total-stock">Total Stock *</Label>
              <Input
                id="total-stock"
                type="number"
                value={totalStock}
                onChange={(e) => setTotalStock(parseInt(e.target.value) || 0)}
                placeholder="Enter total stock"
              />
              <p className="text-xs text-muted-foreground">
                Total available stock across all variants
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unified Pricing Toggle */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-0.5">
          <Label htmlFor="unified-pricing" className="text-base">
            Use Single Price for All Variants
          </Label>
          <p className="text-sm text-muted-foreground">
            Apply one price to all {colors?.length || 0} colors × {availableSizes.length} sizes = {(colors?.length || 0) * availableSizes.length} variants
          </p>
        </div>
        <Switch
          id="unified-pricing"
          checked={unifiedPricing}
          onCheckedChange={setUnifiedPricing}
        />
      </div>

      {/* Info about unified pricing */}
      {unifiedPricing && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Main Price (${mainPrice}) and Total Stock ({totalStock}) will be applied to all {(colors?.length || 0) * availableSizes.length} variant combinations.
          </p>
        </div>
      )}

      {/* Manual Variants - Only shown when not using unified pricing */}
      {!unifiedPricing && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Manual Variants</Label>
            <Button onClick={addVariant} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Variant
            </Button>
          </div>

          {variants.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No variants added yet. Click "Add Variant" to create custom price variants.
            </p>
          )}

          {variants.map((variant, index) => {
            const selectedColor = colors?.find(c => c.id === variant.color_id);
            return (
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
                      <SelectValue>
                        {selectedColor ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: selectedColor.hex_code }}
                            />
                            {selectedColor.name}
                          </div>
                        ) : (
                          "Select color"
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {colors?.filter(color => {
                        // Hide colors that have all sizes selected (excluding current variant)
                        const otherVariants = variants.filter((_, i) => i !== index);
                        const usedSizesForColor = otherVariants.filter(v => v.color_id === color.id).map(v => v.size);
                        return usedSizesForColor.length < availableSizes.length;
                      }).map((color) => (
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
                  <Select
                    value={variant.size}
                    onValueChange={(value) => updateVariant(index, 'size', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSizes.filter(size => {
                        // Hide sizes already selected for this color (excluding current variant)
                        const otherVariants = variants.filter((_, i) => i !== index);
                        const usedSizesForColor = otherVariants
                          .filter(v => v.color_id === variant.color_id)
                          .map(v => v.size);
                        return !usedSizesForColor.includes(size);
                      }).map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
          );
          })}
        </div>
      )}

      {/* Summary */}
      <div className="p-4 bg-muted rounded-lg space-y-2">
        <h4 className="font-medium">Variants Summary</h4>
        {unifiedPricing ? (
          <>
            <p className="text-sm text-muted-foreground">
              Unified pricing enabled: {(colors?.length || 0) * availableSizes.length} variants will be created
            </p>
            <p className="text-sm text-muted-foreground">
              Colors: {colors?.length || 0} | Sizes: {availableSizes.length}
            </p>
            <p className="text-sm text-muted-foreground">
              Price: ${mainPrice || 0} | Stock per variant: {Math.floor(totalStock / ((colors?.length || 0) * availableSizes.length)) || 0}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Manual variants: {variants.length}
            </p>
            {variants.length > 0 && product?.min_price && product?.max_price && (
              <p className="text-sm text-muted-foreground">
                Price range: ${product.min_price} - ${product.max_price}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
});

ProductVariantManager.displayName = 'ProductVariantManager';

export default ProductVariantManager;
