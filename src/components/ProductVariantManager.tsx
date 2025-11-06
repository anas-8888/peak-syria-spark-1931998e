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
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [unifiedPricing, setUnifiedPricing] = useState(false);
  const [unifiedPrice, setUnifiedPrice] = useState<number>(0);
  const [unifiedStock, setUnifiedStock] = useState<number>(0);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [mainPrice, setMainPrice] = useState<number>(0);
  const [totalStock, setTotalStock] = useState<number>(0);
  const [offerPrice, setOfferPrice] = useState<number | null>(null);

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
      setOfferPrice(data.offer_price || null);
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
        throw new Error(t('Please enter a valid main price'));
      }
      
      if (!totalStock || totalStock < 0) {
        throw new Error(t('Please enter a valid total stock'));
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
          throw new Error(t('Manual variants total stock') + ` (${manualStock}) ` + t('exceeds product total stock') + ` (${totalStock}). ` + t('Please adjust variant stocks.'));
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
            t('You have') + ` ${remainingStock} ` + t('units of remaining stock but no available color-size combinations left.') + ` ` +
            t('Total possible combinations') + `: ${allCombinations.length}, ` + t('Already used') + `: ${variants.length}. ` +
            t('Please either increase manual variant stocks to match total stock') + ` (${totalStock}), ` +
            t('reduce total stock to') + ` ${manualStock}, ` + t('or add more color/size options to the product.')
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

      // Update product with main price, total stock, unified_pricing flag, and offer_price
      await supabase
        .from('products')
        .update({ 
          unified_pricing: unifiedPricing,
          price: mainPrice,
          stock_quantity: totalStock,
          offer_price: unifiedPricing && offerPrice && offerPrice < mainPrice ? offerPrice : null
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
      toast.success(t('Variants saved successfully'));
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      if (onSave) onSave();
    },
    onError: (error) => {
      toast.error(t('Failed to save variants') + ': ' + error.message);
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

  if (isLoading) return <div>{t('Loading variants...')}</div>;

  return (
    <div className="space-y-6">
      {/* Main Price and Total Stock - Always shown */}
      <Card>
        <CardHeader>
          <CardTitle>{t('Base Product Settings')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="main-price">{t('Main Price (USD)')} *</Label>
              <Input
                id="main-price"
                type="number"
                step="0.01"
                value={mainPrice}
                onChange={(e) => setMainPrice(parseFloat(e.target.value) || 0)}
                placeholder={t('Enter main price')}
              />
              <p className="text-xs text-muted-foreground">
                {t('Used for variants not explicitly added below')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="total-stock">{t('Total Stock')} *</Label>
              <Input
                id="total-stock"
                type="number"
                value={totalStock}
                onChange={(e) => setTotalStock(parseInt(e.target.value) || 0)}
                placeholder={t('Enter total stock')}
              />
              <p className="text-xs text-muted-foreground">
                {t('Total available stock across all variants')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unified Pricing Toggle */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-0.5">
          <Label htmlFor="unified-pricing" className="text-base">
            {t('Use Single Price for All Variants')}
          </Label>
          <p className="text-sm text-muted-foreground">
            {t('Apply one price to all')} {colors?.length || 0} {t('colors')} × {availableSizes.length} {t('sizes')} = {(colors?.length || 0) * availableSizes.length} {t('variants')}
          </p>
        </div>
        <Switch
          id="unified-pricing"
          checked={unifiedPricing}
          onCheckedChange={setUnifiedPricing}
        />
      </div>

      {/* Offer Price - Only shown for unified pricing */}
      {unifiedPricing && (
        <Card>
          <CardHeader>
            <CardTitle>{t('Offer Price (Optional)')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="offer-price">{t('Offer Price (USD)')}</Label>
              <Input
                id="offer-price"
                type="number"
                step="0.01"
                value={offerPrice || ''}
                onChange={(e) => setOfferPrice(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder={t('Enter offer price (must be less than main price)')}
              />
              <p className="text-xs text-muted-foreground">
                {t('If set, customers will see the main price with a strikethrough and this offer price will be used')}
              </p>
              {offerPrice && offerPrice >= mainPrice && (
                <p className="text-xs text-destructive">
                  {t('Offer price must be less than main price')} (${mainPrice})
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info about unified pricing */}
      {unifiedPricing && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            {t('Main Price')} (${mainPrice}){offerPrice && offerPrice < mainPrice ? ` → ${t('Offer Price')} ($${offerPrice})` : ''} {t('and')} {t('Total Stock')} ({totalStock}) {t('will be applied to all')} {(colors?.length || 0) * availableSizes.length} {t('variant combinations.')}
          </p>
        </div>
      )}

      {/* Manual Variants - Only shown when not using unified pricing */}
      {!unifiedPricing && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">{t('Manual Variants')}</Label>
            <Button onClick={addVariant} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t('Add Variant')}
            </Button>
          </div>

          {variants.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('No variants added yet. Click "Add Variant" to create custom price variants.')}
            </p>
          )}

          {variants.map((variant, index) => {
            const selectedColor = colors?.find(c => c.id === variant.color_id);
            return (
            <div key={index} className="flex gap-3 items-start p-4 border rounded-lg">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
                {/* Color */}
                <div className="space-y-2">
                  <Label>{t('Color')}</Label>
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
                          t("Select color")
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
                  <Label>{t('Size')}</Label>
                  <Select
                    value={variant.size}
                    onValueChange={(value) => updateVariant(index, 'size', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select size")} />
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
                    <Label>{t('Price')}</Label>
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
                  <Label>{t('Stock')}</Label>
                  <Input
                    type="number"
                    value={variant.stock_quantity}
                    onChange={(e) => updateVariant(index, 'stock_quantity', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                {/* Active Toggle */}
                <div className="space-y-2">
                  <Label>{t('Active')}</Label>
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
        <h4 className="font-medium">{t('Variants Summary')}</h4>
        {unifiedPricing ? (
          <>
            <p className="text-sm text-muted-foreground">
              {t('Unified pricing enabled')}: {(colors?.length || 0) * availableSizes.length} {t('variants will be created')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('Colors')}: {colors?.length || 0} | {t('Sizes')}: {availableSizes.length}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('Price')}: ${mainPrice || 0} | {t('Stock per variant')}: {Math.floor(totalStock / ((colors?.length || 0) * availableSizes.length)) || 0}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {t('Manual variants')}: {variants.length}
            </p>
            {variants.length > 0 && product?.min_price && product?.max_price && (
              <p className="text-sm text-muted-foreground">
                {t('Price range')}: ${product.min_price} - ${product.max_price}
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
