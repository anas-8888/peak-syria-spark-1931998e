import { useState } from "react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProductImageManager } from "@/components/ProductImageManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorImageSelector } from "@/components/ColorImageSelector";
import ProductVariantManager from "@/components/ProductVariantManager";
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
  const [colorImageMappings, setColorImageMappings] = useState<{ color_id: string; image_id: string | null }[]>([]);
  const [newSize, setNewSize] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [newColor, setNewColor] = useState({
    color: "",
    image_id: ""
  });
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

  // Fetch products with their primary images
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

      // Map primary images to products
      const productsWithImages = productsData.map(product => {
        const primaryImage = imagesData?.find(img => img.product_id === product.id);
        return {
          ...product,
          image_url: primaryImage?.image_url || product.image_url,
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
        colors: newProduct.colors
      }).select().single();
      if (error) throw error;

      // Add color associations with image mappings
      if (colorImageMappings.length > 0) {
        const colorInserts = colorImageMappings.map(mapping => ({
          product_id: data.id,
          color_id: mapping.color_id,
          image_id: mapping.image_id
        }));
        const { error: colorError } = await supabase
          .from("product_colors")
          .insert(colorInserts);
        if (colorError) throw colorError;
      }

      return data;
    },
    onSuccess: newProduct => {
      queryClient.invalidateQueries({
        queryKey: ["products"]
      });
      toast.success("Product added successfully", {
        description: "You can now add images to this product"
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
      toast.error("Failed to add product", {
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
        const colorInserts = colorImageMappings.map(mapping => ({
          product_id: id,
          color_id: mapping.color_id,
          image_id: mapping.image_id
        }));
        const { error: colorError } = await supabase
          .from("product_colors")
          .insert(colorInserts);
        if (colorError) throw colorError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["products"]
      });
      toast.success("Product updated successfully");
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      resetForm();
    },
    onError: error => {
      toast.error("Failed to update product", {
        description: error.message
      });
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        error
      } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["products"]
      });
      toast.success("Product deleted successfully");
      setDeleteProductId(null);
    },
    onError: error => {
      toast.error("Failed to delete product", {
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
      toast.success(`${selectedProducts.length} products deleted successfully`);
      setSelectedProducts([]);
    },
    onError: error => {
      toast.error("Failed to delete products", {
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
      toast.success("Product status updated");
    },
    onError: (error) => {
      toast.error("Failed to update product status", {
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
      toast.error("Please fill in all required fields");
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
          image_id: mapping.image_id
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
      toast.success("Product added! Now add images.");
    } catch (error: any) {
      toast.error("Failed to add product", {
        description: error.message
      });
    }
  };
  const handleEditProduct = () => {
    if (!selectedProduct || !formData.name || !formData.category) {
      toast.error("Please fill in all required fields");
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
        .select("color_id, image_id")
        .eq("product_id", product.id);
      
      if (error) {
        console.error("Error loading product colors:", error);
        toast.error("Failed to load product colors");
      }

      console.log("Loaded product colors:", productColors);
      
      setColorImageMappings(productColors?.map(pc => ({
        color_id: pc.color_id,
        image_id: pc.image_id
      })) || []);
      
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error("Error opening edit dialog:", error);
      toast.error("Failed to open product for editing");
    }
  };
  const getStockStatus = (stock: number) => {
    if (stock === 0) return {
      label: "Out of Stock",
      variant: "destructive" as const
    };
    if (stock < 10) return {
      label: "Low Stock",
      variant: "secondary" as const
    };
    return {
      label: "In Stock",
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
          <h1 className="text-3xl font-bold mb-2">Product Management</h1>
          <p className="text-muted-foreground">
            View and manage all products in the store
          </p>
        </div>
        <div className="flex gap-2">
          {selectedProducts.length > 0 && <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleteMutation.isPending}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedProducts.length} Selected
            </Button>}
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Product
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search for a product..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="text-center py-8 text-muted-foreground">
              Loading products...
            </div> : filteredProducts.length === 0 ? <div className="text-center py-8 text-muted-foreground">
              No products found
            </div> : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input type="checkbox" checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0} onChange={toggleSelectAll} className="cursor-pointer" />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Flag</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
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
                              <span className="text-xs text-muted-foreground">No image</span>
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
                        {product.offer_price ? <div className="flex items-center gap-2">
                            <span className="text-primary">${product.offer_price?.toFixed(2) || '0.00'}</span>
                            <span className="text-sm line-through text-muted-foreground">${product.price?.toFixed(2) || '0.00'}</span>
                          </div> : <span>${product.price?.toFixed(2) || '0.00'}</span>}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${product.stock_quantity === 0 ? "text-destructive" : product.stock_quantity < 10 ? "text-yellow-600" : "text-green-600"}`}>
                          {product.stock_quantity} units
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
                              title={product.is_active ? "Deactivate" : "Activate"}
                            />
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => openPreviewDialog(product)} title="Preview">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)} title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openCopyDialog(product)} title="Copy Product">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteProductId(product.id)} title="Delete">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>;
            })}
              </TableBody>
            </Table>}
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
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Product Details</TabsTrigger>
              <TabsTrigger value="images" disabled={!selectedProduct}>
                Images and Color
              </TabsTrigger>
              <TabsTrigger value="variants" disabled={!selectedProduct}>
                Variants
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} placeholder="Enter product name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={e => setFormData({
                ...formData,
                description: e.target.value
              })} placeholder="Enter product description" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={value => setFormData({
                  ...formData,
                  category: value
                })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="flag">Product Flag</Label>
                <Select value={formData.flag || undefined} onValueChange={value => setFormData({
                  ...formData,
                  flag: value
                })}>
                  <SelectTrigger>
                    <SelectValue placeholder="No flag" />
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

            {/* Sizes Management */}
            <div className="grid gap-2">
              <Label>Available Sizes (EU)</Label>
              <div className="flex gap-2">
                <Input value={newSize} onChange={e => setNewSize(e.target.value)} placeholder="e.g., 42" onKeyDown={e => {
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
                  Add Size
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
              <Label>Product Features</Label>
              <div className="flex gap-2">
                <Input value={newFeature} onChange={e => setNewFeature(e.target.value)} placeholder="e.g., Premium cushioning technology" onKeyDown={e => {
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
                  Add Feature
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
                      Remove
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
                  Save the product first before adding images
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="variants">
            <div className="py-4">
              {selectedProduct ? (
                <ProductVariantManager 
                  productId={selectedProduct.id}
                  availableColors={colorImageMappings}
                  availableSizes={formData.sizes}
                  onSave={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                    setSelectedProduct(null);
                    toast.success("Product and variants created successfully!");
                  }}
                />
              ) : (
                <p className="text-sm text-muted-foreground mb-4">
                  Save the product first before managing variants
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
              Cancel
            </Button>
            {activeTab === "details" && (
              <Button onClick={async () => {
                await handleAddProduct();
                setActiveTab("images");
              }}>
                Save & Go to Next Tab
              </Button>
            )}
            {activeTab === "images" && selectedProduct && (
              <Button onClick={() => setActiveTab("variants")}>
                Save & Go to Next Tab
              </Button>
            )}
            {activeTab === "variants" && selectedProduct && (
              <Button onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
                setSelectedProduct(null);
                toast.success("Product and variants created successfully!");
              }}>
                Done (Save All & Add Product)
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
            <DialogTitle>Copy Product</DialogTitle>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Product Details</TabsTrigger>
              <TabsTrigger value="images" disabled={!selectedProduct}>
                Images and Color
              </TabsTrigger>
              <TabsTrigger value="variants" disabled={!selectedProduct}>
                Variants
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="copy-name">Product Name *</Label>
              <Input id="copy-name" value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} placeholder="Enter product name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="copy-description">Description</Label>
              <Textarea id="copy-description" value={formData.description} onChange={e => setFormData({
                ...formData,
                description: e.target.value
              })} placeholder="Enter product description" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="copy-category">Category *</Label>
                <Select value={formData.category} onValueChange={value => setFormData({
                  ...formData,
                  category: value
                })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="copy-flag">Product Flag</Label>
                <Select value={formData.flag || undefined} onValueChange={value => setFormData({
                  ...formData,
                  flag: value
                })}>
                  <SelectTrigger>
                    <SelectValue placeholder="No flag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New Arrival">New Arrival</SelectItem>
                    <SelectItem value="Offer">Offer</SelectItem>
                    <SelectItem value="Best Seller">Best Seller</SelectItem>
                    <SelectItem value="Limited Edition">Limited Edition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="copy-target_gender">Target Gender</Label>
              <Select value={formData.target_gender} onValueChange={value => setFormData({
                ...formData,
                target_gender: value
              })}>
                <SelectTrigger id="copy-target_gender">
                  <SelectValue placeholder="Select target gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="men">Men</SelectItem>
                  <SelectItem value="women">Women</SelectItem>
                  <SelectItem value="both">Both / Unisex</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sizes Management */}
            <div className="grid gap-2">
              <Label>Available Sizes (EU)</Label>
              <div className="flex gap-2">
                <Input value={newSize} onChange={e => setNewSize(e.target.value)} placeholder="e.g., 42" onKeyDown={e => {
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
                  Add Size
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
              <Label>Product Features</Label>
              <div className="flex gap-2">
                <Input value={newFeature} onChange={e => setNewFeature(e.target.value)} placeholder="e.g., Premium cushioning technology" onKeyDown={e => {
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
                  Add Feature
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
                      Remove
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
                  Save the product first before adding images
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="variants">
            <div className="py-4">
              {selectedProduct ? (
                <ProductVariantManager 
                  productId={selectedProduct.id}
                  availableColors={colorImageMappings}
                  availableSizes={formData.sizes}
                  onSave={() => {
                    setIsCopyDialogOpen(false);
                    resetForm();
                    setSelectedProduct(null);
                    toast.success("Product and variants copied successfully!");
                  }}
                />
              ) : (
                <p className="text-sm text-muted-foreground mb-4">
                  Save the product first before managing variants
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
              Cancel
            </Button>
            {activeTab === "details" && (
              <Button onClick={async () => {
                await handleAddProduct();
                setActiveTab("images");
              }} disabled={addProductMutation.isPending}>
                {addProductMutation.isPending ? "Copying..." : "Save & Go to Next Tab"}
              </Button>
            )}
            {activeTab === "images" && selectedProduct && (
              <Button onClick={() => setActiveTab("variants")}>
                Save & Go to Next Tab
              </Button>
            )}
            {activeTab === "variants" && selectedProduct && (
              <Button onClick={() => {
                setIsCopyDialogOpen(false);
                resetForm();
                setSelectedProduct(null);
                toast.success("Product and variants copied successfully!");
              }}>
                Done (Save All & Copy Product)
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
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Product Details</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Product Name *</Label>
              <Input id="edit-name" value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} placeholder="Enter product name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" value={formData.description} onChange={e => setFormData({
                ...formData,
                description: e.target.value
              })} placeholder="Enter product description" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category *</Label>
                <Select value={formData.category} onValueChange={value => setFormData({
                  ...formData,
                  category: value
                })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-flag">Product Flag</Label>
                <Select value={formData.flag || undefined} onValueChange={value => setFormData({
                  ...formData,
                  flag: value
                })}>
                  <SelectTrigger>
                    <SelectValue placeholder="No flag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New Arrival">New Arrival</SelectItem>
                    <SelectItem value="Offer">Offer</SelectItem>
                    <SelectItem value="Best Seller">Best Seller</SelectItem>
                    <SelectItem value="Limited Edition">Limited Edition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Display SKU */}
            {selectedProduct?.sku && <div className="grid gap-2">
                <Label>SKU (Auto-generated)</Label>
                <Input value={selectedProduct.sku} disabled className="bg-muted" />
              </div>}

            <div className="grid gap-2">
              <Label htmlFor="edit-target_gender">Target Gender</Label>
              <Select value={formData.target_gender} onValueChange={value => setFormData({
                ...formData,
                target_gender: value
              })}>
                <SelectTrigger id="edit-target_gender">
                  <SelectValue placeholder="Select target gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="men">Men</SelectItem>
                  <SelectItem value="women">Women</SelectItem>
                  <SelectItem value="both">Both / Unisex</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sizes Management */}
            <div className="grid gap-2">
              <Label>Available Sizes (EU)</Label>
              <div className="flex gap-2">
                <Input value={newSize} onChange={e => setNewSize(e.target.value)} placeholder="e.g., 42" onKeyDown={e => {
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
                  Add Size
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
              <Label>Product Features</Label>
              <div className="flex gap-2">
                <Input value={newFeature} onChange={e => setNewFeature(e.target.value)} placeholder="e.g., Premium cushioning technology" onKeyDown={e => {
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
                  Add Feature
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
                      Remove
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
                  productId={selectedProduct.id}
                  availableColors={colorImageMappings}
                  availableSizes={formData.sizes}
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
              Cancel
            </Button>
            <Button onClick={handleEditProduct} disabled={updateProductMutation.isPending}>
              {updateProductMutation.isPending ? "Updating..." : "Update Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Product Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Preview</DialogTitle>
          </DialogHeader>
          {selectedProduct && <div className="space-y-6">
              {/* Image Gallery */}
              <div className="space-y-4">
                <h3 className="font-semibold">Product Images</h3>
                {previewImages.length > 0 ? <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {previewImages.map(image => <div key={image.id} className="relative group">
                        <img src={image.image_url} alt="Product" className={`w-full aspect-square object-cover rounded-lg ${image.is_primary ? "ring-2 ring-primary" : ""}`} />
                        {image.is_primary && <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            Primary
                          </div>}
                      </div>)}
                  </div> : <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No images available</p>
                  </div>}
              </div>

              {/* Product Details */}
              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="text-lg font-semibold">{selectedProduct.name}</p>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="text-sm">{selectedProduct.description || "No description"}</p>
                </div>

                {selectedProduct.sku && <div>
                    <Label className="text-muted-foreground">SKU</Label>
                    <p className="font-mono text-sm">{selectedProduct.sku}</p>
                  </div>}

                {selectedProduct.flag && <div>
                    <Label className="text-muted-foreground">Flag</Label>
                    <Badge variant="secondary">{selectedProduct.flag}</Badge>
                  </div>}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="font-medium">{selectedProduct.category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Rating</Label>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{selectedProduct.rating || 0}/5</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Price</Label>
                    <div className="flex items-center gap-2">
                      {selectedProduct.offer_price ? <>
                          <p className="text-lg font-bold text-primary">${selectedProduct.offer_price?.toFixed(2) || '0.00'}</p>
                          <p className="text-sm line-through text-muted-foreground">${selectedProduct.price?.toFixed(2) || '0.00'}</p>
                        </> : <p className="text-lg font-bold">${selectedProduct.price?.toFixed(2) || '0.00'}</p>}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Stock</Label>
                    <p className="font-medium">{selectedProduct.stock_quantity} units</p>
                  </div>
                </div>

                {selectedProduct.sizes && selectedProduct.sizes.length > 0 && <div>
                    <Label className="text-muted-foreground">Available Sizes</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedProduct.sizes.map((size, idx) => <Badge key={idx} variant="outline">{size}</Badge>)}
                    </div>
                  </div>}

                {selectedProduct.features && selectedProduct.features.length > 0 && <div>
                    <Label className="text-muted-foreground">Features</Label>
                    <div className="flex flex-col gap-2 mt-2">
                      {selectedProduct.features.map((feature, idx) => <div key={idx} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          <span>{feature}</span>
                        </div>)}
                    </div>
                  </div>}

                {selectedProduct.colors && selectedProduct.colors.length > 0 && <div>
                    <Label className="text-muted-foreground">Available Colors</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedProduct.colors.map((colorItem, idx) => <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
                          <div className="w-6 h-6 rounded-full border-2 border-border" style={{
                    backgroundColor: colorItem.color
                  }} title={colorItem.color} />
                          <span className="text-sm font-medium">{colorItem.color}</span>
                        </div>)}
                    </div>
                  </div>}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge variant={getStockStatus(selectedProduct.stock_quantity).variant} className="mx-[20px]">
                      {getStockStatus(selectedProduct.stock_quantity).label}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Active</Label>
                    <Badge variant={selectedProduct.is_active ? "default" : "secondary"} className="mx-[20px]">
                      {selectedProduct.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
            setIsPreviewDialogOpen(false);
            if (selectedProduct) openEditDialog(selectedProduct);
          }}>
              Edit Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
            if (deleteProductId) {
              deleteProductMutation.mutate(deleteProductId);
            }
          }} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedProducts.length} products?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedProducts.length} 
              {selectedProducts.length === 1 ? " product" : " products"} from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default Products;