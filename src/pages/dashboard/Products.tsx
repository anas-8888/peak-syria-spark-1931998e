import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Edit, Trash2, Eye, Star, Image as ImageIcon, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ProductImageManager } from "@/components/ProductImageManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorImageSelector } from "@/components/ColorImageSelector";
import ProductVariantManager, { ProductVariantManagerHandle } from "@/components/ProductVariantManager";
import { usePermissions } from "@/hooks/usePermissions";
type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
  colors?: {
    color: string;
    image_id: string;
  }[];
  offer_price?: number | null;
  rating?: number;
  sizes?: string[];
  sku?: string;
  features?: string[];
  flag?: string | null;
  min_price?: number | null;
  max_price?: number | null;
  unified_pricing?: boolean;
};
type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
};
type Category = {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  is_active: boolean;
};
const Products = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("details");
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    stock_quantity: "",
    image_url: "",
    offer_price: "",
    rating: "0",
    sizes: [] as string[],
    features: [] as string[],
    flag: "",
    target_gender: "both",
    colors: [] as {
      color: string;
      image_id: string;
    }[]
  });
  const [colorImageMappings, setColorImageMappings] = useState<{ color_id: string; image_id: string | null; display_order?: number }[]>([]);
  const [newSize, setNewSize] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [newColor, setNewColor] = useState({
    color: "",
    image_id: ""
  });
  
  // Refs for variant managers
  const addVariantManagerRef = useRef<ProductVariantManagerHandle>(null);
  const editVariantManagerRef = useRef<ProductVariantManagerHandle>(null);
  const copyVariantManagerRef = useRef<ProductVariantManagerHandle>(null);
  
  const queryClient = useQueryClient();

  // Fetch categories
  const {
    data: categories = []
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("categories").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return data as Category[];
    }
  });

  // Fetch product flags from hero_slides
  const {
    data: productFlags = []
  } = useQuery({
    queryKey: ["product-flags"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("hero_slides").select("flag_name").eq("is_active", true);
      if (error) throw error;
      
      // Get unique flag names
      const uniqueFlags = [...new Set(data.map(item => item.flag_name))];
      return uniqueFlags;
    }
  });

  // Fetch products with their primary images and variant data
  const {
    data: products = [],
    isLoading
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const {
        data: productsData,
        error: productsError
      } = await supabase.from("products").select("*").order("created_at", {
        ascending: false
      });
      if (productsError) throw productsError;

      // Fetch primary images for all products
      const {
        data: imagesData
      } = await supabase.from("product_images").select("product_id, image_url").eq("is_primary", true);

      // Fetch variants for all products to calculate price range and total stock
      const {
        data: variantsData
      } = await supabase.from("product_variants").select("product_id, price, stock_quantity, is_active");

      // Map primary images and variant data to products
      const productsWithImages = productsData.map(product => {
        const primaryImage = imagesData?.find(img => img.product_id === product.id);
        const productVariants = variantsData?.filter(v => v.product_id === product.id && v.is_active) || [];
        
        // Calculate price range and total stock from active variants
        const prices = productVariants.map(v => v.price).filter(p => p > 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : product.price;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : product.price;
        const totalStock = productVariants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
        
        // Preserve the actual offer_price from database if it exists
        // Only show variant price range if no unified pricing with offer price
        const hasOfferPrice = product.offer_price && product.offer_price < product.price;
        
        return {
          ...product,
          image_url: primaryImage?.image_url || product.image_url,
          price: hasOfferPrice ? product.price : minPrice, // Keep original price if has offer, otherwise use min variant price
          offer_price: hasOfferPrice ? product.offer_price : (minPrice !== maxPrice ? maxPrice : null), // Keep offer_price if exists, otherwise show variant range
          stock_quantity: totalStock || product.stock_quantity,
          colors: product.colors as any as {
            color: string;
            image_id: string;
          }[] | undefined
        };
      });
      return productsWithImages as Product[];
    }
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (newProduct: typeof formData) => {
      // Check permission
      if (!hasPermission('create_products')) {
        throw new Error("You don't have permission to create products");
      }
      // Generate SKU
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 7).toUpperCase();
      const sku = `PEAK-${timestamp}-${random}`;

      const {
        data,
        error
      } = await supabase.from("products").insert({
        name: newProduct.name,
        description: newProduct.description || null,
        category: newProduct.category,
        price: 0, // Will be set by variants
        stock_quantity: 0, // Will be calculated from variants
        image_url: newProduct.image_url || null,
        is_active: true,
        offer_price: null,
        rating: 0, // Will be calculated from reviews
        sizes: newProduct.sizes,
        features: newProduct.features,
        flag: newProduct.flag || null,
        target_gender: newProduct.target_gender,
        colors: newProduct.colors,
        sku: sku
      }).select().single();
      if (error) throw error;

      // Add color associations with image mappings
      if (colorImageMappings.length > 0) {
        const colorInserts = colorImageMappings
          .filter(mapping => mapping.color_id) // Only include valid color IDs
          .map(mapping => ({
            product_id: data.id,
            color_id: mapping.color_id,
            image_id: mapping.image_id || null
          }));
        
        if (colorInserts.length > 0) {
          const { error: colorError } = await supabase
            .from("product_colors")
            .insert(colorInserts);
          if (colorError) {
            console.error("Error inserting product colors:", colorError);
            throw colorError;
          }
        }
      }

      return data;
    },
    onSuccess: newProduct => {
      queryClient.invalidateQueries({
        queryKey: ["products"]
      });
      toast.success(t("Product added successfully"), {
        description: t("You can now add images to this product")
      });
      // Switch to the product for editing with images
      setSelectedProduct({
        ...newProduct,
        colors: newProduct.colors as any as {
          color: string;
          image_id: string;
        }[] | undefined
      } as Product);
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(true);
      resetForm();
    },
    onError: error => {
      toast.error(t("Failed to add product"), {
        description: error.message
      });
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string;
      updates: typeof formData;
    }) => {
      // Check permission
      if (!hasPermission('edit_products')) {
        throw new Error("You don't have permission to edit products");
      }
      const {
        error
      } = await supabase.from("products").update({
        name: updates.name,
        description: updates.description || null,
        category: updates.category,
        price: 0, // Set by variants
        stock_quantity: 0, // Calculated from variants
        image_url: updates.image_url || null,
        offer_price: null,
        rating: 0, // Calculated from reviews
        sizes: updates.sizes,
        features: updates.features,
        flag: updates.flag || null,
        target_gender: updates.target_gender,
        colors: updates.colors
      }).eq("id", id);
      if (error) throw error;

      // Update color associations with image mappings
      // First, delete existing associations
      const { error: deleteError } = await supabase
        .from("product_colors")
        .delete()
        .eq("product_id", id);
      if (deleteError) throw deleteError;

      // Then add new ones with image mappings
      if (colorImageMappings.length > 0) {
        const colorInserts = colorImageMappings
          .filter(mapping => mapping.color_id) // Only include valid color IDs
          .map(mapping => ({
            product_id: id,
            color_id: mapping.color_id,
            image_id: mapping.image_id || null,
            display_order: mapping.display_order || 0
          }));
        
        if (colorInserts.length > 0) {
          const { error: colorError } = await supabase
            .from("product_colors")
            .insert(colorInserts);
          if (colorError) {
            console.error("Error inserting product colors:", colorError);
            throw colorError;
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["products"]
      });
      toast.success(t("Product updated successfully"));
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      resetForm();
    },
    onError: error => {
      toast.error(t("Failed to update product"), {
        description: error.message
      });
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check permission
      if (!hasPermission('delete_products')) {
        throw new Error("You don't have permission to delete products");
      }
      const {
        error
      } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["products"]
      });
      toast.success(t("Product deleted successfully"));
      setDeleteProductId(null);
    },
    onError: error => {
      toast.error(t("Failed to delete product"), {
        description: error.message
      });
    }
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const {
        error
      } = await supabase.from("products").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["products"]
      });
      toast.success(t(`${selectedProducts.length} products deleted successfully`));
      setSelectedProducts([]);
    },
    onError: error => {
      toast.error(t("Failed to delete products"), {
        description: error.message
      });
    }
  });

  // Toggle product active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(t("Product status updated"));
    },
    onError: (error) => {
      toast.error(t("Failed to update product status"), {
        description: error.message,
      });
    },
  });

  // Fetch images for preview
  const {
    data: previewImages = []
  } = useQuery({
    queryKey: ["product-images", selectedProduct?.id],
    queryFn: async () => {
      if (!selectedProduct?.id) return [];
      const {
        data,
        error
      } = await supabase.from("product_images").select("*").eq("product_id", selectedProduct.id).order("display_order", {
        ascending: true
      });
      if (error) throw error;
      return data as ProductImage[];
    },
    enabled: !!selectedProduct?.id && isPreviewDialogOpen
  });

  // Fetch variants for preview
  const {
    data: previewVariants = []
  } = useQuery({
    queryKey: ["product-variants-preview", selectedProduct?.id],
    queryFn: async () => {
      if (!selectedProduct?.id) return [];
      const {
        data,
        error
      } = await supabase
        .from("product_variants")
        .select(`
          *,
          colors (name, hex_code)
        `)
        .eq("product_id", selectedProduct.id)
        .eq("is_active", true)
        .order("price", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProduct?.id && isPreviewDialogOpen
  });

  // Fetch product colors with images for preview
  const {
    data: previewProductColors = []
  } = useQuery({
    queryKey: ["product-colors-preview", selectedProduct?.id],
    queryFn: async () => {
      if (!selectedProduct?.id) return [];
      const {
        data,
        error
      } = await supabase
        .from("product_colors")
        .select(`
          *,
          colors (name, hex_code),
          product_images (image_url)
        `)
        .eq("product_id", selectedProduct.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProduct?.id && isPreviewDialogOpen
  });

  // Fetch product reviews for rating calculation in preview
  const {
    data: previewReviews = []
  } = useQuery({
    queryKey: ["product-reviews-preview", selectedProduct?.id],
    queryFn: async () => {
      if (!selectedProduct?.id) return [];
      const {
        data,
        error
      } = await supabase
        .from("product_reviews")
        .select("rating")
        .eq("product_id", selectedProduct.id)
        .eq("status", "approved");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProduct?.id && isPreviewDialogOpen
  });

  // Calculate average rating for preview
  const previewRating = previewReviews.length > 0
    ? previewReviews.reduce((sum, review) => sum + review.rating, 0) / previewReviews.length
    : 0;
  const filteredProducts = products.filter(product => product.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      price: "",
      stock_quantity: "",
      image_url: "",
      offer_price: "",
      rating: "0",
      sizes: [],
      features: [],
      flag: "",
      target_gender: "both",
      colors: []
    });
    setSelectedCategoryIds([]);
    setColorImageMappings([]);
    setActiveTab("details");
    setNewSize("");
    setNewFeature("");
    setNewColor({
      color: "",
      image_id: ""
    });
  };
  const handleAddProduct = async () => {
    if (!formData.name || !formData.category) {
      toast.error(t("Please fill in all required fields"));
      return;
    }
    try {
      const {
        data,
        error
      } = await supabase.from("products").insert({
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        price: 0, // Will be set by variants
        stock_quantity: 0, // Will be calculated from variants
        image_url: formData.image_url || null,
        is_active: true,
        offer_price: null,
        rating: 0, // Will be calculated from reviews
        sizes: formData.sizes,
        features: formData.features,
        flag: formData.flag || null,
        target_gender: formData.target_gender,
        colors: formData.colors
      }).select().single();
      if (error) throw error;

      // Add color associations with image mappings
      if (colorImageMappings.length > 0) {
        const colorInserts = colorImageMappings.map(mapping => ({
          product_id: data.id,
          color_id: mapping.color_id,
          image_id: mapping.image_id,
          display_order: mapping.display_order || 0
        }));
        const { error: colorError } = await supabase
          .from("product_colors")
          .insert(colorInserts);
        if (colorError) throw colorError;
      }

      // Set the selected product and switch to images tab
      setSelectedProduct({
        ...data,
        colors: data.colors as any as {
          color: string;
          image_id: string;
        }[] | undefined
      } as Product);
      setActiveTab("images");
      queryClient.invalidateQueries({
        queryKey: ["products"]
      });
      toast.success(t("Product added! Now add images."));
    } catch (error: any) {
      toast.error(t("Failed to add product"), {
        description: error.message
      });
    }
  };
  const handleEditProduct = () => {
    if (!selectedProduct || !formData.name || !formData.category) {
      toast.error(t("Please fill in all required fields"));
      return;
    }
    updateProductMutation.mutate({
      id: selectedProduct.id,
      updates: formData
    });
  };
  const openEditDialog = async (product: Product) => {
    try {
      // Reset to details tab first
      setActiveTab("details");
      
      setSelectedProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        category: product.category,
        price: "0",
        stock_quantity: "0",
        image_url: product.image_url || "",
        offer_price: "",
        rating: "0",
        sizes: product.sizes || [],
        features: product.features || [],
        flag: product.flag || "",
        target_gender: (product as any).target_gender || "both",
        colors: product.colors || []
      });

      // Load existing color-image associations
      const { data: productColors, error } = await supabase
        .from("product_colors")
        .select("color_id, image_id, display_order")
        .eq("product_id", product.id)
        .order("display_order", { ascending: true });
      
      if (error) {
        console.error("Error loading product colors:", error);
        toast.error(t("Failed to load product colors"));
      }

      setColorImageMappings(productColors?.map(pc => ({
        color_id: pc.color_id,
        image_id: pc.image_id,
        display_order: pc.display_order || 0
      })) || []);
      
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error("Error opening edit dialog:", error);
      toast.error(t("Failed to open product for editing"));
    }
  };
  const getStockStatus = (stock: number) => {
    if (stock === 0) return {
      label: t("Out of Stock"),
      variant: "destructive" as const
    };
    if (stock < 10) return {
      label: t("Low Stock"),
      variant: "secondary" as const
    };
    return {
      label: t("In Stock"),
      variant: "default" as const
    };
  };
  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };
  const toggleSelectProduct = (id: string) => {
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };
  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) return;
    setBulkDeleteDialogOpen(true);
  };
  const confirmBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedProducts);
    setBulkDeleteDialogOpen(false);
  };
  const openPreviewDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsPreviewDialogOpen(true);
  };
  const openCopyDialog = (product: Product) => {
    setSelectedProduct(null); // Don't set selected product for copy
    setFormData({
      name: `Copy of ${product.name}`,
      description: product.description || "",
      category: product.category,
      price: "0",
      stock_quantity: "0",
      image_url: product.image_url || "",
      offer_price: "",
      rating: "0",
      sizes: product.sizes || [],
      features: product.features || [],
      flag: product.flag || "",
      target_gender: (product as any).target_gender || "both",
      colors: product.colors || []
    });
    setIsCopyDialogOpen(true);
  };
  return <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t("Product Management")}</h1>
          <p className="text-muted-foreground">
            {t("View and manage all products in the store")}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedProducts.length > 0 && <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleteMutation.isPending}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t("Delete")} {selectedProducts.length} {t("Selected")}
            </Button>}
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("Add New Product")}
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("Search for a product...")} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("Products")} ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Image")}</TableHead>
                    <TableHead>{t("Name")}</TableHead>
                    <TableHead>{t("Category")}</TableHead>
                    <TableHead>{t("Price")}</TableHead>
                    <TableHead>{t("Stock")}</TableHead>
                    <TableHead>{t("Status")}</TableHead>
                    <TableHead>{t("Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-16 w-16 rounded-lg" />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("No products found")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input type="checkbox" checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0} onChange={toggleSelectAll} className="cursor-pointer" />
                  </TableHead>
                  <TableHead>{t("Product")}</TableHead>
                  <TableHead>{t("Category")}</TableHead>
                  <TableHead>{t("Flag")}</TableHead>
                  <TableHead>{t("Price")}</TableHead>
                  <TableHead>{t("Stock")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead>{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map(product => {
              const stockStatus = getStockStatus(product.stock_quantity);
              return <TableRow key={product.id} className="hover:bg-muted/50">
                      <TableCell>
                        <input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => toggleSelectProduct(product.id)} className="cursor-pointer" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.image_url ? <img src={product.image_url} alt={product.name} className="h-12 w-12 rounded-lg object-cover cursor-pointer" onClick={() => openPreviewDialog(product)} /> : <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">{t("No image")}</span>
                            </div>}
                          <span className="font-medium cursor-pointer hover:text-primary" onClick={() => openPreviewDialog(product)}>{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        {product.flag ? (
                          <Badge variant="secondary" className="text-xs">
                            {product.flag}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {product.offer_price && product.offer_price < product.price ? (
                          <div className="flex items-center gap-2">
                            <span className="text-primary">{formatPrice(product.offer_price)}</span>
                            <span className="text-sm text-muted-foreground line-through">
                              {formatPrice(product.price)}
                            </span>
                          </div>
                        ) : product.min_price && product.max_price && product.min_price !== product.max_price ? (
                          <span className="text-muted-foreground">
                            {formatPrice(product.min_price)} - {formatPrice(product.max_price)}
                          </span>
                        ) : (
                          <span>{formatPrice(product.price || 0)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${product.stock_quantity === 0 ? "text-destructive" : product.stock_quantity < 10 ? "text-yellow-600" : "text-green-600"}`}>
                          {product.stock_quantity || 0} {t("units")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={stockStatus.variant}>
                          {stockStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 border-r pr-2">
                            <Switch
                              checked={product.is_active}
                              onCheckedChange={(checked) => {
                                toggleActiveMutation.mutate({ id: product.id, isActive: checked });
                              }}
                              title={product.is_active ? t("Deactivate") : t("Activate")}
                            />
                          </div>
                          {hasPermission('view_products') && (
                            <Button variant="ghost" size="icon" onClick={() => openPreviewDialog(product)} title={t("Preview")}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {hasPermission('edit_products') && (
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)} title={t("Edit")}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {hasPermission('create_products') && (
                            <Button variant="ghost" size="icon" onClick={() => openCopyDialog(product)} title={t("Copy Product")}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                          {hasPermission('delete_products') && (
                            <Button variant="ghost" size="icon" onClick={() => setDeleteProductId(product.id)} title={t("Delete")}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>;
            })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={open => {
      setIsAddDialogOpen(open);
      if (!open) {
        resetForm();
        setSelectedProduct(null);
      }
    }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Add New Product")}</DialogTitle>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">{t("Product Details")}</TabsTrigger>
              <TabsTrigger value="images" disabled={!selectedProduct}>
                {t("Images and Color")}
              </TabsTrigger>
              <TabsTrigger value="variants" disabled={!selectedProduct}>
                {t("Variants")}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("Product Name")} *</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} placeholder={t("Enter product name")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{t("Description")}</Label>
              <Textarea id="description" value={formData.description} onChange={e => setFormData({
                ...formData,
                description: e.target.value
              })} placeholder={t("Enter product description")} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">{t("Category")} *</Label>
                <Select value={formData.category} onValueChange={value => setFormData({
                  ...formData,
                  category: value
                })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select a category")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="flag">{t("Product Flag")}</Label>
                <Select value={formData.flag || undefined} onValueChange={value => setFormData({
                  ...formData,
                  flag: value
                })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("No flag")} />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {productFlags.map((flag) => (
                      <SelectItem key={flag} value={flag}>
                        {flag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="target-gender">{t("Target Gender")} *</Label>
                <Select value={formData.target_gender} onValueChange={value => setFormData({
                  ...formData,
                  target_gender: value
                })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select target gender")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="men">{t("Men")}</SelectItem>
                    <SelectItem value="women">{t("Women")}</SelectItem>
                    <SelectItem value="both">{t("Both")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sku">{t("SKU (Auto-generated)")}</Label>
                <Input 
                  id="sku" 
                  value={selectedProduct?.sku || t("Will be generated on save")} 
                  disabled
                  className="bg-muted"
                  placeholder={t("Auto-generated SKU")}
                />
              </div>
            </div>

            {/* Sizes Management */}
            <div className="grid gap-2">
              <Label>{t("Available Sizes (EU)")}</Label>
              <div className="flex gap-2">
                <Input value={newSize} onChange={e => setNewSize(e.target.value)} placeholder={t("e.g., 42")} onKeyDown={e => {
                  if (e.key === 'Enter' && newSize.trim()) {
                    e.preventDefault();
                    setFormData({
                      ...formData,
                      sizes: [...formData.sizes, newSize.trim()]
                    });
                    setNewSize("");
                  }
                }} />
                <Button type="button" onClick={() => {
                  if (newSize.trim()) {
                    setFormData({
                      ...formData,
                      sizes: [...formData.sizes, newSize.trim()]
                    });
                    setNewSize("");
                  }
                }}>
                  {t("Add Size")}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.sizes.map((size, index) => <Badge key={index} variant="secondary" className="gap-1">
                    {size}
                    <button type="button" onClick={() => {
                    setFormData({
                      ...formData,
                      sizes: formData.sizes.filter((_, i) => i !== index)
                    });
                  }} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>)}
              </div>
            </div>

            {/* Features Management */}
            <div className="grid gap-2">
              <Label>{t("Product Features")}</Label>
              <div className="flex gap-2">
                <Input value={newFeature} onChange={e => setNewFeature(e.target.value)} placeholder={t("e.g., Premium cushioning technology")} onKeyDown={e => {
                  if (e.key === 'Enter' && newFeature.trim()) {
                    e.preventDefault();
                    setFormData({
                      ...formData,
                      features: [...formData.features, newFeature.trim()]
                    });
                    setNewFeature("");
                  }
                }} />
                <Button type="button" onClick={() => {
                  if (newFeature.trim()) {
                    setFormData({
                      ...formData,
                      features: [...formData.features, newFeature.trim()]
                    });
                    setNewFeature("");
                  }
                }}>
                  {t("Add Feature")}
                </Button>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                {formData.features.map((feature, index) => <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                    <span className="flex-1">{feature}</span>
                    <button type="button" onClick={() => {
                    setFormData({
                      ...formData,
                      features: formData.features.filter((_, i) => i !== index)
                    });
                  }} className="text-destructive hover:underline">
                      {t("Remove")}
                    </button>
                  </div>)}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="images">
            <div className="py-4">
              {selectedProduct ? (
                <ProductImageManager 
                  productId={selectedProduct.id}
                  colorImageMappings={colorImageMappings}
                  onColorImageMappingsChange={setColorImageMappings}
                />
              ) : (
                <p className="text-sm text-muted-foreground mb-4">
                  {t("Save the product first before adding images")}
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="variants">
            <div className="py-4">
              {selectedProduct ? (
                <ProductVariantManager 
                  ref={addVariantManagerRef}
                  productId={selectedProduct.id}
                  availableColors={colorImageMappings}
                  availableSizes={formData.sizes}
                  initialProduct={{
                    price: selectedProduct.price,
                    stock_quantity: selectedProduct.stock_quantity,
                    unified_pricing: selectedProduct.unified_pricing || false,
                    offer_price: selectedProduct.offer_price || null,
                  }}
                  onSave={() => {
                    // This will be called after successful save
                  }}
                />
              ) : (
                <p className="text-sm text-muted-foreground mb-4">
                  {t("Save the product first before managing variants")}
                </p>
              )}
            </div>
          </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
            setIsAddDialogOpen(false);
            resetForm();
            setSelectedProduct(null);
          }}>
              {t("Cancel")}
            </Button>
            {activeTab === "details" && (
              <Button onClick={async () => {
                await handleAddProduct();
                setActiveTab("images");
              }}>
                {t("Save & Go to Next Tab")}
              </Button>
            )}
            {activeTab === "images" && selectedProduct && (
              <Button onClick={async () => {
                // Save color-image mappings before going to next tab
                if (selectedProduct?.id && colorImageMappings.length > 0) {
                  try {
                    // Delete existing associations
                    await supabase
                      .from("product_colors")
                      .delete()
                      .eq("product_id", selectedProduct.id);

                    // Add new ones
                    const colorInserts = colorImageMappings
                      .filter(mapping => mapping.color_id)
                      .map(mapping => ({
                        product_id: selectedProduct.id,
                        color_id: mapping.color_id,
                        image_id: mapping.image_id || null,
                        display_order: mapping.display_order || 0
                      }));
                    
                    if (colorInserts.length > 0) {
                      const { error } = await supabase
                        .from("product_colors")
                        .insert(colorInserts);
                      if (error) throw error;
                    }
                    toast.success(t("Color-image mappings saved!"));
                  } catch (error: any) {
                    toast.error(t("Failed to save color-image mappings: ") + error.message);
                    return;
                  }
                }
                setActiveTab("variants");
              }}>
                {t("Save & Go to Next Tab")}
              </Button>
            )}
            {activeTab === "variants" && selectedProduct && (
              <Button onClick={async () => {
                try {
                  await addVariantManagerRef.current?.saveVariants();
                  setIsAddDialogOpen(false);
                  resetForm();
                  setSelectedProduct(null);
                  queryClient.invalidateQueries({ queryKey: ["products"] });
                  toast.success(t("Product and variants created successfully!"));
                } catch (error) {
                  console.error("Failed to save variants:", error);
                }
              }}>
                {t("Done (Save All & Add Product)")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy Product Dialog */}
      <Dialog open={isCopyDialogOpen} onOpenChange={open => {
      setIsCopyDialogOpen(open);
      if (!open) {
        resetForm();
        setSelectedProduct(null);
      }
    }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Copy Product")}</DialogTitle>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">{t("Product Details")}</TabsTrigger>
              <TabsTrigger value="images" disabled={!selectedProduct}>
                {t("Images and Color")}
              </TabsTrigger>
              <TabsTrigger value="variants" disabled={!selectedProduct}>
                {t("Variants")}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="copy-name">{t("Product Name")} *</Label>
              <Input id="copy-name" value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} placeholder={t("Enter product name")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="copy-description">{t("Description")}</Label>
              <Textarea id="copy-description" value={formData.description} onChange={e => setFormData({
                ...formData,
                description: e.target.value
              })} placeholder={t("Enter product description")} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="copy-category">{t("Category")} *</Label>
                <Select value={formData.category} onValueChange={value => setFormData({
                  ...formData,
                  category: value
                })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select a category")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="copy-flag">{t("Product Flag")}</Label>
                <Select value={formData.flag || undefined} onValueChange={value => setFormData({
                  ...formData,
                  flag: value
                })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("No flag")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New Arrival">{t("New Arrival")}</SelectItem>
                    <SelectItem value="Offer">{t("Offer")}</SelectItem>
                    <SelectItem value="Best Seller">{t("Best Seller")}</SelectItem>
                    <SelectItem value="Limited Edition">{t("Limited Edition")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="copy-target_gender">{t("Target Gender")}</Label>
              <Select value={formData.target_gender} onValueChange={value => setFormData({
                ...formData,
                target_gender: value
              })}>
                <SelectTrigger id="copy-target_gender">
                  <SelectValue placeholder={t("Select target gender")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="men">{t("Men")}</SelectItem>
                  <SelectItem value="women">{t("Women")}</SelectItem>
                  <SelectItem value="both">{t("Both / Unisex")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sizes Management */}
            <div className="grid gap-2">
              <Label>{t("Available Sizes (EU)")}</Label>
              <div className="flex gap-2">
                <Input value={newSize} onChange={e => setNewSize(e.target.value)} placeholder={t("e.g., 42")} onKeyDown={e => {
                  if (e.key === 'Enter' && newSize.trim()) {
                    e.preventDefault();
                    setFormData({
                      ...formData,
                      sizes: [...formData.sizes, newSize.trim()]
                    });
                    setNewSize("");
                  }
                }} />
                <Button type="button" onClick={() => {
                  if (newSize.trim()) {
                    setFormData({
                      ...formData,
                      sizes: [...formData.sizes, newSize.trim()]
                    });
                    setNewSize("");
                  }
                }}>
                  {t("Add Size")}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.sizes.map((size, index) => <Badge key={index} variant="secondary" className="gap-1">
                    {size}
                    <button type="button" onClick={() => {
                    setFormData({
                      ...formData,
                      sizes: formData.sizes.filter((_, i) => i !== index)
                    });
                  }} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>)}
              </div>
            </div>

            {/* Features Management */}
            <div className="grid gap-2">
              <Label>{t("Product Features")}</Label>
              <div className="flex gap-2">
                <Input value={newFeature} onChange={e => setNewFeature(e.target.value)} placeholder={t("e.g., Premium cushioning technology")} onKeyDown={e => {
                  if (e.key === 'Enter' && newFeature.trim()) {
                    e.preventDefault();
                    setFormData({
                      ...formData,
                      features: [...formData.features, newFeature.trim()]
                    });
                    setNewFeature("");
                  }
                }} />
                <Button type="button" onClick={() => {
                  if (newFeature.trim()) {
                    setFormData({
                      ...formData,
                      features: [...formData.features, newFeature.trim()]
                    });
                    setNewFeature("");
                  }
                }}>
                  {t("Add Feature")}
                </Button>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                {formData.features.map((feature, index) => <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                    <span className="flex-1">{feature}</span>
                    <button type="button" onClick={() => {
                    setFormData({
                      ...formData,
                      features: formData.features.filter((_, i) => i !== index)
                    });
                  }} className="text-destructive hover:underline">
                      {t("Remove")}
                    </button>
                  </div>)}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="images">
            <div className="py-4">
              {selectedProduct ? (
                <ProductImageManager 
                  productId={selectedProduct.id}
                  colorImageMappings={colorImageMappings}
                  onColorImageMappingsChange={setColorImageMappings}
                />
              ) : (
                <p className="text-sm text-muted-foreground mb-4">
                  {t("Save the product first before adding images")}
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="variants">
            <div className="py-4">
              {selectedProduct ? (
                <ProductVariantManager 
                  ref={copyVariantManagerRef}
                  productId={selectedProduct.id}
                  availableColors={colorImageMappings}
                  availableSizes={formData.sizes}
                  initialProduct={{
                    price: selectedProduct.price,
                    stock_quantity: selectedProduct.stock_quantity,
                    unified_pricing: selectedProduct.unified_pricing || false,
                    offer_price: selectedProduct.offer_price || null,
                  }}
                  onSave={() => {
                    // This will be called after successful save
                  }}
                />
              ) : (
                <p className="text-sm text-muted-foreground mb-4">
                  {t("Save the product first before managing variants")}
                </p>
              )}
            </div>
          </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
            setIsCopyDialogOpen(false);
            resetForm();
            setSelectedProduct(null);
          }}>
              {t("Cancel")}
            </Button>
            {activeTab === "details" && (
              <Button onClick={async () => {
                await handleAddProduct();
                setActiveTab("images");
              }} disabled={addProductMutation.isPending}>
                {addProductMutation.isPending ? t("Copying...") : t("Save & Go to Next Tab")}
              </Button>
            )}
            {activeTab === "images" && selectedProduct && (
              <Button onClick={async () => {
                // Save color-image mappings before going to next tab
                if (selectedProduct?.id && colorImageMappings.length > 0) {
                  try {
                    // Delete existing associations
                    await supabase
                      .from("product_colors")
                      .delete()
                      .eq("product_id", selectedProduct.id);

                    // Add new ones
                    const colorInserts = colorImageMappings
                      .filter(mapping => mapping.color_id)
                      .map(mapping => ({
                        product_id: selectedProduct.id,
                        color_id: mapping.color_id,
                        image_id: mapping.image_id || null,
                        display_order: mapping.display_order || 0
                      }));
                    
                    if (colorInserts.length > 0) {
                      const { error } = await supabase
                        .from("product_colors")
                        .insert(colorInserts);
                      if (error) throw error;
                    }
                    toast.success(t("Color-image mappings saved!"));
                  } catch (error: any) {
                    toast.error(t("Failed to save color-image mappings: ") + error.message);
                    return;
                  }
                }
                setActiveTab("variants");
              }}>
                {t("Save & Go to Next Tab")}
              </Button>
            )}
            {activeTab === "variants" && selectedProduct && (
              <Button onClick={async () => {
                try {
                  await copyVariantManagerRef.current?.saveVariants();
                  setIsCopyDialogOpen(false);
                  resetForm();
                  setSelectedProduct(null);
                  queryClient.invalidateQueries({ queryKey: ["products"] });
                  toast.success(t("Product copied successfully!"));
                } catch (error) {
                  console.error("Failed to save variants:", error);
                }
              }}>
                {t("Done (Save All & Copy Product)")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          resetForm();
          setSelectedProduct(null);
          setActiveTab("details");
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Edit Product")}</DialogTitle>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">{t("Product Details")}</TabsTrigger>
              <TabsTrigger value="images">{t("Images and Color")}</TabsTrigger>
              <TabsTrigger value="variants">{t("Variants")}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">{t("Product Name")} *</Label>
              <Input id="edit-name" value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} placeholder={t("Enter product name")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">{t("Description")}</Label>
              <Textarea id="edit-description" value={formData.description} onChange={e => setFormData({
                ...formData,
                description: e.target.value
              })} placeholder={t("Enter product description")} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category">{t("Category")} *</Label>
                <Select value={formData.category} onValueChange={value => setFormData({
                  ...formData,
                  category: value
                })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select a category")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-flag">{t("Product Flag")}</Label>
                <Select value={formData.flag || undefined} onValueChange={value => setFormData({
                  ...formData,
                  flag: value
                })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("No flag")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New Arrival">{t("New Arrival")}</SelectItem>
                    <SelectItem value="Offer">{t("Offer")}</SelectItem>
                    <SelectItem value="Best Seller">{t("Best Seller")}</SelectItem>
                    <SelectItem value="Limited Edition">{t("Limited Edition")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Display SKU */}
            {selectedProduct?.sku && <div className="grid gap-2">
                <Label>{t("SKU (Auto-generated)")}</Label>
                <Input value={selectedProduct.sku} disabled className="bg-muted" />
              </div>}

            <div className="grid gap-2">
              <Label htmlFor="edit-target_gender">{t("Target Gender")}</Label>
              <Select value={formData.target_gender} onValueChange={value => setFormData({
                ...formData,
                target_gender: value
              })}>
                <SelectTrigger id="edit-target_gender">
                  <SelectValue placeholder={t("Select target gender")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="men">{t("Men")}</SelectItem>
                  <SelectItem value="women">{t("Women")}</SelectItem>
                  <SelectItem value="both">{t("Both / Unisex")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sizes Management */}
            <div className="grid gap-2">
              <Label>{t("Available Sizes (EU)")}</Label>
              <div className="flex gap-2">
                <Input value={newSize} onChange={e => setNewSize(e.target.value)} placeholder={t("e.g., 42")} onKeyDown={e => {
                  if (e.key === 'Enter' && newSize.trim()) {
                    e.preventDefault();
                    setFormData({
                      ...formData,
                      sizes: [...formData.sizes, newSize.trim()]
                    });
                    setNewSize("");
                  }
                }} />
                <Button type="button" onClick={() => {
                  if (newSize.trim()) {
                    setFormData({
                      ...formData,
                      sizes: [...formData.sizes, newSize.trim()]
                    });
                    setNewSize("");
                  }
                }}>
                  {t("Add Size")}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.sizes.map((size, index) => <Badge key={index} variant="secondary" className="gap-1">
                    {size}
                    <button type="button" onClick={() => {
                    setFormData({
                      ...formData,
                      sizes: formData.sizes.filter((_, i) => i !== index)
                    });
                  }} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>)}
              </div>
            </div>

            {/* Features Management */}
            <div className="grid gap-2">
              <Label>{t("Product Features")}</Label>
              <div className="flex gap-2">
                <Input value={newFeature} onChange={e => setNewFeature(e.target.value)} placeholder={t("e.g., Premium cushioning technology")} onKeyDown={e => {
                  if (e.key === 'Enter' && newFeature.trim()) {
                    e.preventDefault();
                    setFormData({
                      ...formData,
                      features: [...formData.features, newFeature.trim()]
                    });
                    setNewFeature("");
                  }
                }} />
                <Button type="button" onClick={() => {
                  if (newFeature.trim()) {
                    setFormData({
                      ...formData,
                      features: [...formData.features, newFeature.trim()]
                    });
                    setNewFeature("");
                  }
                }}>
                  {t("Add Feature")}
                </Button>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                {formData.features.map((feature, index) => <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                    <span className="flex-1">{feature}</span>
                    <button type="button" onClick={() => {
                    setFormData({
                      ...formData,
                      features: formData.features.filter((_, i) => i !== index)
                    });
                  }} className="text-destructive hover:underline">
                      {t("Remove")}
                    </button>
                  </div>)}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="images">
            <div className="py-4">
              {selectedProduct && (
                <ProductImageManager 
                  productId={selectedProduct.id}
                  colorImageMappings={colorImageMappings}
                  onColorImageMappingsChange={setColorImageMappings}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="variants">
            <div className="py-4">
              {selectedProduct && (
                <ProductVariantManager 
                  ref={editVariantManagerRef}
                  productId={selectedProduct.id}
                  availableColors={colorImageMappings}
                  availableSizes={formData.sizes}
                  initialProduct={{
                    price: selectedProduct.price,
                    stock_quantity: selectedProduct.stock_quantity,
                    unified_pricing: selectedProduct.unified_pricing || false,
                    offer_price: selectedProduct.offer_price || null,
                  }}
                  onSave={() => {
                    // This will be called after successful save
                  }}
                />
              )}
            </div>
          </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
            setIsEditDialogOpen(false);
            setSelectedProduct(null);
            resetForm();
          }}>
              {t("Cancel")}
            </Button>
            {activeTab === "details" && (
              <Button onClick={async () => {
                await handleEditProduct();
                setActiveTab("images");
              }} disabled={updateProductMutation.isPending}>
                {updateProductMutation.isPending ? t("Updating...") : t("Save & Go to Next Tab")}
              </Button>
            )}
            {activeTab === "images" && (
              <Button onClick={async () => {
                // Save color-image mappings before going to next tab
                if (selectedProduct?.id && colorImageMappings.length > 0) {
                  try {
                    // Delete existing associations
                    await supabase
                      .from("product_colors")
                      .delete()
                      .eq("product_id", selectedProduct.id);

                    // Add new ones
                    const colorInserts = colorImageMappings
                      .filter(mapping => mapping.color_id)
                      .map(mapping => ({
                        product_id: selectedProduct.id,
                        color_id: mapping.color_id,
                        image_id: mapping.image_id || null,
                        display_order: mapping.display_order || 0
                      }));
                    
                    if (colorInserts.length > 0) {
                      const { error } = await supabase
                        .from("product_colors")
                        .insert(colorInserts);
                      if (error) throw error;
                    }
                    toast.success(t("Color-image mappings saved!"));
                  } catch (error: any) {
                    toast.error(t("Failed to save color-image mappings: ") + error.message);
                    return;
                  }
                }
                setActiveTab("variants");
              }}>
                {t("Save & Go to Next Tab")}
              </Button>
            )}
            {activeTab === "variants" && (
              <Button onClick={async () => {
                try {
                  await editVariantManagerRef.current?.saveVariants();
                  setIsEditDialogOpen(false);
                  resetForm();
                  setSelectedProduct(null);
                  queryClient.invalidateQueries({ queryKey: ["products"] });
                  toast.success(t("Product updated successfully!"));
                } catch (error) {
                  console.error("Failed to save variants:", error);
                }
              }}>
                {t("Done (Save All & Update Product)")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Product Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Product Preview")}</DialogTitle>
          </DialogHeader>
          {selectedProduct && <div className="space-y-6">
              {/* Image Gallery */}
              <div className="space-y-4">
                <h3 className="font-semibold">{t("Product Images")}</h3>
                {previewImages.length > 0 ? <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {previewImages.map(image => {
                      // Find the color associated with this image
                      const colorAssociation = previewProductColors.find(pc => pc.image_id === image.id);
                      return (
                        <div key={image.id} className="relative group">
                          <img src={image.image_url} alt={t("Product")} className={`w-full aspect-square object-cover rounded-lg ${image.is_primary ? "ring-2 ring-primary" : ""}`} />
                          {image.is_primary && <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current" />
                              {t("Primary")}
                            </div>}
                          {colorAssociation && colorAssociation.colors && (
                            <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm text-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1 border">
                              <div 
                                className="w-3 h-3 rounded-full border" 
                                style={{ backgroundColor: colorAssociation.colors.hex_code }}
                              />
                              {colorAssociation.colors.name}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div> : <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>{t("No images available")}</p>
                  </div>}
              </div>

              {/* Product Details */}
              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label className="text-muted-foreground">{t("Name")}</Label>
                  <p className="text-lg font-semibold">{selectedProduct.name}</p>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">{t("Description")}</Label>
                  <p className="text-sm">{selectedProduct.description || t("No description")}</p>
                </div>

                {selectedProduct.sku && <div>
                    <Label className="text-muted-foreground">{t("SKU")}</Label>
                    <p className="font-mono text-sm">{selectedProduct.sku}</p>
                  </div>}

                {selectedProduct.flag && <div>
                    <Label className="text-muted-foreground">{t("Flag")}</Label>
                    <Badge variant="secondary">{selectedProduct.flag}</Badge>
                  </div>}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">{t("Category")}</Label>
                    <p className="font-medium">{selectedProduct.category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{t("Target Gender")}</Label>
                    <Badge variant="outline">
                      {(selectedProduct as any).target_gender === 'men' ? t('Men') : 
                       (selectedProduct as any).target_gender === 'women' ? t('Women') : 
                       t('Both / Unisex')}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">{t("Rating")}</Label>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">
                        {previewRating > 0 ? previewRating.toFixed(1) : '0'}/5
                        {previewReviews.length > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({previewReviews.length} {previewReviews.length === 1 ? t('review') : t('reviews')})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">{t("Price")}</Label>
                    {selectedProduct.offer_price && selectedProduct.offer_price < selectedProduct.price ? (
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-primary">{formatPrice(selectedProduct.offer_price)}</p>
                        <p className="text-sm text-muted-foreground line-through">{formatPrice(selectedProduct.price)}</p>
                      </div>
                    ) : selectedProduct.min_price && selectedProduct.max_price && selectedProduct.min_price !== selectedProduct.max_price ? (
                      <p className="text-lg font-bold text-muted-foreground">
                        {formatPrice(selectedProduct.min_price)} - {formatPrice(selectedProduct.max_price)}
                      </p>
                    ) : (
                      <p className="text-lg font-bold">{formatPrice(selectedProduct.price || 0)}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{t("Total Stock")}</Label>
                    <p className="font-medium">{selectedProduct.stock_quantity || 0} {t("units")}</p>
                  </div>
                </div>

                {selectedProduct.sizes && selectedProduct.sizes.length > 0 && <div>
                    <Label className="text-muted-foreground">{t("Available Sizes")}</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedProduct.sizes.map((size, idx) => <Badge key={idx} variant="outline">{size}</Badge>)}
                    </div>
                  </div>}

                {selectedProduct.features && selectedProduct.features.length > 0 && <div>
                    <Label className="text-muted-foreground">{t("Features")}</Label>
                    <div className="flex flex-col gap-2 mt-2">
                      {selectedProduct.features.map((feature, idx) => <div key={idx} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          <span>{feature}</span>
                        </div>)}
                    </div>
                  </div>}

                {selectedProduct.colors && selectedProduct.colors.length > 0 && <div>
                    <Label className="text-muted-foreground">{t("Available Colors")}</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {previewProductColors.length > 0 ? (
                        previewProductColors.map((colorItem, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
                            <div className="w-6 h-6 rounded-full border-2 border-border" style={{
                              backgroundColor: colorItem.colors?.hex_code
                            }} title={colorItem.colors?.name} />
                            <span className="text-sm font-medium">{colorItem.colors?.name}</span>
                            {colorItem.image_id && <Badge variant="secondary" className="text-xs">{t("Has Image")}</Badge>}
                          </div>
                        ))
                      ) : (
                        selectedProduct.colors.map((colorItem, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
                            <div className="w-6 h-6 rounded-full border-2 border-border" style={{
                              backgroundColor: colorItem.color
                            }} title={colorItem.color} />
                            <span className="text-sm font-medium">{colorItem.color}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>}

                {/* Product Variants Table */}
                {(previewVariants.length > 0 || (selectedProduct.colors && selectedProduct.sizes?.length)) && (
                  <div>
                    <Label className="text-muted-foreground mb-3 block">{t("Product Variants")}</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("Color")}</TableHead>
                            <TableHead>{t("Size")}</TableHead>
                            <TableHead>{t("Price")}</TableHead>
                            <TableHead>{t("Stock")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewVariants.map((variant) => (
                            <TableRow key={variant.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded-full border" 
                                    style={{ backgroundColor: variant.colors?.hex_code }}
                                  />
                                  {variant.colors?.name}
                                </div>
                              </TableCell>
                              <TableCell>{variant.size}</TableCell>
                              <TableCell className="font-semibold">{formatPrice(variant.price)}</TableCell>
                              <TableCell>{variant.stock_quantity} {t("units")}</TableCell>
                            </TableRow>
                          ))}
                          {(() => {
                            const productColors = selectedProduct.colors ? JSON.parse(JSON.stringify(selectedProduct.colors)) : [];
                            const productSizes = selectedProduct.sizes || [];
                            const variantCombos = new Set(previewVariants.map(v => `${v.color_id}-${v.size}`));
                            
                            const unlistedCombos: any[] = [];
                            productColors.forEach((colorObj: any) => {
                              productSizes.forEach((size: string) => {
                                if (!variantCombos.has(`${colorObj.color_id}-${size}`)) {
                                  unlistedCombos.push({ color_id: colorObj.color_id, size });
                                }
                              });
                            });

                            if (unlistedCombos.length > 0) {
                              const unlistedColorIds = [...new Set(unlistedCombos.map(c => c.color_id))];
                              const unlistedSizes = [...new Set(unlistedCombos.map(c => c.size))];
                              const unlistedStock = (selectedProduct.stock_quantity || 0) - previewVariants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
                              
                              return (
                                <TableRow className="bg-muted/50">
                                  <TableCell>
                                    <div className="text-sm text-muted-foreground">
                                      {t("Unlisted")}: {unlistedColorIds.length} {t("color(s)")}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm text-muted-foreground">
                                      {unlistedSizes.join(', ')}
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-semibold">{formatPrice(selectedProduct.price || 0)}</TableCell>
                                  <TableCell>{unlistedStock} {t("units")}</TableCell>
                                </TableRow>
                              );
                            }
                            return null;
                          })()}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">{t("Status")}</Label>
                    <Badge variant={getStockStatus(selectedProduct.stock_quantity).variant} className="mx-[20px]">
                      {getStockStatus(selectedProduct.stock_quantity).label}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{t("Active")}</Label>
                    <Badge variant={selectedProduct.is_active ? "default" : "secondary"} className="mx-[20px]">
                      {selectedProduct.is_active ? t("Active") : t("Inactive")}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              {t("Close")}
            </Button>
            <Button onClick={() => {
            setIsPreviewDialogOpen(false);
            if (selectedProduct) openEditDialog(selectedProduct);
          }}>
              {t("Edit Product")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Are you sure?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("This action cannot be undone. This will permanently delete the product from the database.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
            if (deleteProductId) {
              deleteProductMutation.mutate(deleteProductId);
            }
          }} className="bg-destructive hover:bg-destructive/90">
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete")} {selectedProducts.length} {t("products?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("This action cannot be undone. This will permanently delete")} {selectedProducts.length} 
              {selectedProducts.length === 1 ? ` ${t("product")}` : ` ${t("products")}`} {t("from the database.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive hover:bg-destructive/90">
              {t("Delete All")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default Products;