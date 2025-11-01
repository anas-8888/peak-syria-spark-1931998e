import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface FilterOptions {
  categories: string[];
  colors: string[];
  sizes: string[];
  priceRange: [number, number];
}

interface ProductFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  categories: string[];
  colors: Array<{ name: string; value: string; hex: string }>;
  sizes: string[];
  minPrice: number;
  maxPrice: number;
}

const ProductFilters = ({ filters, onFilterChange, categories, colors, sizes, minPrice, maxPrice }: ProductFiltersProps) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [tempPriceRange, setTempPriceRange] = useState<[number, number]>(filters.priceRange);
  const [priceDebounceTimer, setPriceDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Sync local filters with parent filters (e.g., from URL params)
  useEffect(() => {
    setLocalFilters(filters);
    setTempPriceRange(filters.priceRange);
  }, [filters]);

  const handleCategoryToggle = (category: string) => {
    const newCategories = localFilters.categories.includes(category)
      ? localFilters.categories.filter((c) => c !== category)
      : [...localFilters.categories, category];
    const newFilters = { ...localFilters, categories: newCategories };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
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

  const commitPriceChange = useCallback((value: [number, number]) => {
    const newFilters = { ...localFilters, priceRange: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  }, [localFilters, onFilterChange]);

  const handlePriceChange = (value: number[]) => {
    const newRange = [value[0], value[1]] as [number, number];
    setTempPriceRange(newRange);
    
    // Clear existing timer
    if (priceDebounceTimer) {
      clearTimeout(priceDebounceTimer);
    }
    
    // Set new timer for auto-commit after 800ms of inactivity
    const timer = setTimeout(() => {
      commitPriceChange(newRange);
    }, 800);
    
    setPriceDebounceTimer(timer);
  };

  const handlePriceCommit = (value: number[]) => {
    // Clear debounce timer if exists
    if (priceDebounceTimer) {
      clearTimeout(priceDebounceTimer);
      setPriceDebounceTimer(null);
    }
    
    const newRange = [value[0], value[1]] as [number, number];
    commitPriceChange(newRange);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (priceDebounceTimer) {
        clearTimeout(priceDebounceTimer);
      }
    };
  }, [priceDebounceTimer]);

  const clearAllFilters = () => {
    const resetFilters: FilterOptions = {
      categories: [],
      colors: [],
      sizes: [],
      priceRange: [minPrice, maxPrice],
    };
    setLocalFilters(resetFilters);
    setTempPriceRange([minPrice, maxPrice]);
    onFilterChange(resetFilters);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Clear Filters */}
      {(localFilters.categories.length > 0 ||
        localFilters.colors.length > 0 ||
        localFilters.sizes.length > 0 ||
        tempPriceRange[0] !== minPrice ||
        tempPriceRange[1] !== maxPrice) && (
        <Button variant="outline" onClick={clearAllFilters} className="w-full">
          <X className="mr-2 h-4 w-4" />
          Clear All Filters
        </Button>
      )}

      {/* Categories */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg">Categories</h3>
        {categories.length > 0 ? (
          categories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${category}`}
                checked={localFilters.categories.includes(category)}
                onCheckedChange={() => handleCategoryToggle(category)}
              />
              <Label htmlFor={`cat-${category}`} className="cursor-pointer">
                {category}
              </Label>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No categories available</p>
        )}
      </div>

      {/* Colors */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg">Colors</h3>
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
                title={color.name}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No colors available</p>
        )}
      </div>

      {/* Sizes */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg">Sizes (EU)</h3>
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
          <p className="text-sm text-muted-foreground">No sizes available</p>
        )}
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg">Price Range</h3>
        <div className="px-2">
          <Slider
            min={minPrice}
            max={maxPrice}
            step={1}
            value={tempPriceRange}
            onValueChange={handlePriceChange}
            onValueCommit={handlePriceCommit}
            className="mb-4"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${tempPriceRange[0].toFixed(2)}</span>
            <span>${tempPriceRange[1].toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden lg:block bg-card rounded-lg shadow-sm sticky top-24">
        <ScrollArea className="h-[calc(100vh-8rem)] p-6">
          <FilterContent />
        </ScrollArea>
      </div>

      {/* Mobile Filters */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="lg:hidden">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
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
