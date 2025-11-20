import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, SlidersHorizontal, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";

interface FilterOptions {
  categories: string[];
  colors: string[];
  sizes: string[];
  priceRange: [number, number];
}

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  display_order: number | null;
}

interface ProductFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  categories: Category[];
  colors: Array<{ name: string; value: string; hex: string }>;
  sizes: string[];
  minPrice: number;
  maxPrice: number;
}

const ProductFilters = ({ filters, onFilterChange, categories, colors, sizes, minPrice, maxPrice }: ProductFiltersProps) => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [localFilters, setLocalFilters] = useState(filters);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  // Use refs for uncontrolled inputs to prevent re-renders that cause scroll
  const minPriceInputRef = useRef<HTMLInputElement>(null);
  const maxPriceInputRef = useRef<HTMLInputElement>(null);
  // Track if user is currently editing price inputs
  const isEditingPriceRef = useRef(false);
  // Track last known parent filters to detect changes
  const lastParentFiltersRef = useRef(filters);
  // Track initial values for inputs
  const [inputKey, setInputKey] = useState(0);

  // Update local state when parent filters change (but don't update price inputs if user is editing)
  useEffect(() => {
    // Skip entirely if user is editing - don't do ANY state updates
    if (isEditingPriceRef.current) {
      return;
    }
    
    const priceChanged = filters.priceRange[0] !== lastParentFiltersRef.current.priceRange[0] || 
                        filters.priceRange[1] !== lastParentFiltersRef.current.priceRange[1];
    
    const categoriesChanged = JSON.stringify(filters.categories) !== JSON.stringify(lastParentFiltersRef.current.categories);
    const colorsChanged = JSON.stringify(filters.colors) !== JSON.stringify(lastParentFiltersRef.current.colors);
    const sizesChanged = JSON.stringify(filters.sizes) !== JSON.stringify(lastParentFiltersRef.current.sizes);
    
    // Only update if something actually changed
    if (priceChanged || categoriesChanged || colorsChanged || sizesChanged) {
      // Update price inputs only if price changed - use key to force re-render
      if (priceChanged) {
        setInputKey(prev => prev + 1);
        // Update refs after a brief delay to ensure DOM is ready
        setTimeout(() => {
          if (minPriceInputRef.current) {
            minPriceInputRef.current.value = filters.priceRange[0].toString();
          }
          if (maxPriceInputRef.current) {
            maxPriceInputRef.current.value = filters.priceRange[1].toString();
          }
        }, 0);
      }
      
      // Update local filters, preserving current price range if user hasn't applied it yet
      setLocalFilters(prevLocal => ({
        ...filters,
        priceRange: priceChanged ? filters.priceRange : prevLocal.priceRange
      }));
      
      lastParentFiltersRef.current = filters;
    }
  }, [filters]);

  // Build category tree
  const buildCategoryTree = () => {
    const tree: Map<string | null, Category[]> = new Map();
    categories.forEach(cat => {
      const parentId = cat.parent_id;
      if (!tree.has(parentId)) {
        tree.set(parentId, []);
      }
      tree.get(parentId)!.push(cat);
    });
    
    // Sort each level by display_order
    tree.forEach((cats, key) => {
      tree.set(key, cats.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
    });
    
    return tree;
  };

  const categoryTree = buildCategoryTree();

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCategoryToggle = (categoryName: string) => {
    const newCategories = localFilters.categories.includes(categoryName)
      ? localFilters.categories.filter((c) => c !== categoryName)
      : [...localFilters.categories, categoryName];
    const newFilters = { ...localFilters, categories: newCategories };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const renderCategoryTree = (parentId: string | null, level: number = 0): JSX.Element[] => {
    const children = categoryTree.get(parentId) || [];
    
    return children.map((category) => {
      const hasChildren = categoryTree.has(category.id);
      const isExpanded = expandedCategories.has(category.id);
      
      return (
        <div key={category.id} style={{ marginLeft: `${level * 12}px` }}>
          <div className="flex items-center space-x-1.5 py-1">
            {hasChildren ? (
              <button
                onClick={() => toggleCategory(category.id)}
                className="p-0.5 hover:bg-muted rounded transition-colors"
              >
                <ChevronRight
                  className={`h-3 w-3 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>
            ) : (
              <span className="w-4" />
            )}
            <Checkbox
              id={`cat-${category.id}`}
              checked={localFilters.categories.includes(category.name)}
              onCheckedChange={() => handleCategoryToggle(category.name)}
              className="h-3 w-3 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4"
            />
            <Label
              htmlFor={`cat-${category.id}`}
              className="cursor-pointer text-[10px] sm:text-xs flex-1"
            >
              {t(category.name)}
            </Label>
          </div>
          {hasChildren && isExpanded && (
            <div className="mt-1">
              {renderCategoryTree(category.id, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const handleColorToggle = (color: string) => {
    const newColors = localFilters.colors.includes(color)
      ? localFilters.colors.filter((c) => c !== color)
      : [...localFilters.colors, color];
    const newFilters = { ...localFilters, colors: newColors };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSizeToggle = (size: string) => {
    const newSizes = localFilters.sizes.includes(size)
      ? localFilters.sizes.filter((s) => s !== size)
      : [...localFilters.sizes, size];
    const newFilters = { ...localFilters, sizes: newSizes };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Handle price input changes (only update ref, don't apply filter or cause re-render)
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Set editing flag to prevent useEffect from running
    isEditingPriceRef.current = true;
    // No state update - input is uncontrolled, so no re-render happens
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Set editing flag to prevent useEffect from running
    isEditingPriceRef.current = true;
    // No state update - input is uncontrolled, so no re-render happens
  };

  // Apply price filter when button is clicked
  const handleApplyPriceFilter = () => {
    const minValueStr = minPriceInputRef.current?.value || filters.priceRange[0].toString();
    const maxValueStr = maxPriceInputRef.current?.value || filters.priceRange[1].toString();
    let minValue = parseFloat(minValueStr) || minPrice;
    let maxValue = parseFloat(maxValueStr) || maxPrice;
    
    // Clamp values to valid range
    minValue = Math.max(minPrice, Math.min(minValue, maxPrice));
    maxValue = Math.max(minPrice, Math.min(maxValue, maxPrice));
    
    // Ensure min <= max
    if (minValue > maxValue) {
      minValue = maxValue;
    }
    if (maxValue < minValue) {
      maxValue = minValue;
    }
    
    // Update input values in refs
    if (minPriceInputRef.current) {
      minPriceInputRef.current.value = minValue.toString();
    }
    if (maxPriceInputRef.current) {
      maxPriceInputRef.current.value = maxValue.toString();
    }
    
    // Mark that we're done editing
    isEditingPriceRef.current = false;
    
    // Apply filter
    const newPriceRange: [number, number] = [minValue, maxValue];
    const newFilters = {
      ...localFilters,
      priceRange: newPriceRange
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    isEditingPriceRef.current = false;
    const resetFilters: FilterOptions = {
      categories: [],
      colors: [],
      sizes: [],
      priceRange: [minPrice, maxPrice],
    };
    setLocalFilters(resetFilters);
    // Update input refs
    if (minPriceInputRef.current) {
      minPriceInputRef.current.value = minPrice.toString();
    }
    if (maxPriceInputRef.current) {
      maxPriceInputRef.current.value = maxPrice.toString();
    }
    // Force re-render of inputs
    setInputKey(prev => prev + 1);
    onFilterChange(resetFilters);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Clear Filters */}
      {(localFilters.categories.length > 0 ||
        localFilters.colors.length > 0 ||
        localFilters.sizes.length > 0 ||
        localFilters.priceRange[0] !== minPrice ||
        localFilters.priceRange[1] !== maxPrice) && (
        <Button variant="outline" onClick={clearAllFilters} className="w-full">
          <X className="mr-2 h-4 w-4" />
          {t("Clear All Filters")}
        </Button>
      )}

      {/* Categories */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg">{t("Categories")}</h3>
        {categories.length > 0 ? (
          <div className="space-y-1">
            {renderCategoryTree(null)}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("No categories available")}</p>
        )}
      </div>

      {/* Colors */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg">{t("Colors")}</h3>
        {colors.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorToggle(color.value)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  localFilters.colors.includes(color.value)
                    ? "border-primary scale-110 ring-2 ring-primary ring-offset-2"
                    : "border-border hover:scale-105"
                }`}
                style={{ backgroundColor: color.hex }}
                title={t(color.name)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("No colors available")}</p>
        )}
      </div>

      {/* Sizes */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg">{t("Sizes")} (EU)</h3>
        {sizes.length > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => handleSizeToggle(size)}
                className={`py-2 rounded-md border-2 transition-all ${
                  localFilters.sizes.includes(size)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("No sizes available")}</p>
        )}
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg">{t("Price Range")}</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="min-price" className="text-sm whitespace-nowrap min-w-[60px]">
              {t("Min")}:
            </Label>
            <Input
              key={`min-price-${inputKey}`}
              ref={minPriceInputRef}
              id="min-price"
              type="number"
              min={minPrice}
              max={maxPrice}
              defaultValue={filters.priceRange[0].toString()}
              onChange={handleMinPriceChange}
              onFocus={() => {
                isEditingPriceRef.current = true;
              }}
              onBlur={() => {
                // Don't reset flag on blur, only on Apply or Clear
              }}
              className="flex-1"
              placeholder={minPrice.toString()}
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">s.p</span>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="max-price" className="text-sm whitespace-nowrap min-w-[60px]">
              {t("Max")}:
            </Label>
            <Input
              key={`max-price-${inputKey}`}
              ref={maxPriceInputRef}
              id="max-price"
              type="number"
              min={minPrice}
              max={maxPrice}
              defaultValue={filters.priceRange[1].toString()}
              onChange={handleMaxPriceChange}
              onFocus={() => {
                isEditingPriceRef.current = true;
              }}
              onBlur={() => {
                // Don't reset flag on blur, only on Apply or Clear
              }}
              className="flex-1"
              placeholder={maxPrice.toString()}
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">s.p</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground pt-1">
            <span>{t("Range")}: {formatPrice(minPrice)} - {formatPrice(maxPrice)}</span>
          </div>
          <Button 
            onClick={handleApplyPriceFilter}
            className="w-full"
            variant="default"
          >
            {t("Apply")}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden lg:block bg-card rounded-lg shadow-sm sticky top-24">
        <ScrollArea className="h-[calc(100vh-8rem)] p-6">
          <div className="pl-2">
            <FilterContent />
          </div>
        </ScrollArea>
      </div>

      {/* Mobile Filters */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="lg:hidden">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            {t("Filters")}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("Filters")}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ProductFilters;
