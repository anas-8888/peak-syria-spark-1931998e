import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Eye, Mail, Phone, UserPlus, TrendingUp, Users as UsersIcon, UserCheck, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getOptimizedImageUrl } from "@/utils/imageCache";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { usePermissions } from "@/hooks/usePermissions";

interface Customer {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  totalOrders: number;
  totalSpent: number;
  role_id: string;
  role: { name: string };
  avatar_url: string | null;
}

const Users = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Fetch all roles for the filter (exclude customer role for creating users)
  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Allow all roles for user creation
  const allRoles = roles;
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone: "",
    address: "",
    role_id: "",
  });

  const [newUserData, setNewUserData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role_id: "",
  });

  // Fetch users with order stats and roles (with pagination)
  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ["users", currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Get profiles with role information
      const { data: profiles, error: profilesError, count } = await supabase
        .from("profiles")
        .select(`
          *,
          role:roles(name)
        `, { count: 'exact' })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (profilesError) throw profilesError;

      // Get order stats for each user
      const customersWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: orders } = await supabase
            .from("orders")
            .select("total_amount")
            .eq("user_id", profile.id);

          const totalOrders = orders?.length || 0;
          const totalSpent = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

          return {
            ...profile,
            totalOrders,
            totalSpent,
          };
        })
      );

      return {
        customers: customersWithStats as Customer[],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE)
      };
    },
  });

  const customers = paginatedData?.customers || [];
  const totalPages = paginatedData?.totalPages || 1;

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<typeof formData> }) => {
      const { error } = await supabase
        .from("profiles")
        .update(data.updates)
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(t("User updated successfully"));
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(t("Failed to update customer"), {
        description: error.message,
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { user_id: id }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(t("User deleted successfully"));
    },
    onError: (error: any) => {
      toast.error(t("Failed to delete user"), {
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setFormData({
      email: "",
      full_name: "",
      phone: "",
      address: "",
      role_id: "",
    });
    setSelectedCustomer(null);
  };

  const resetNewUserForm = () => {
    setNewUserData({ email: "", password: "", full_name: "", phone: "", role_id: "" });
    setIsAddUserDialogOpen(false);
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      email: customer.email || "",
      full_name: customer.full_name || "",
      phone: customer.phone || "",
      address: customer.address || "",
      role_id: customer.role_id || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string, customer: Customer) => {
    // Check permission
    if (!hasPermission('delete_users')) {
      toast.error(t("You don't have permission to delete users"));
      return;
    }

    // Prevent deleting yourself
    if (currentUser && id === currentUser.id) {
      toast.error(t("Cannot delete your own account"));
      return;
    }
    
    // Prevent deleting super admin
    if (customer.role?.name?.toLowerCase() === 'super admin') {
      toast.error(t("Cannot delete super admin accounts"));
      return;
    }
    
    setCustomerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (customerToDelete) {
      deleteMutation.mutate(customerToDelete);
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const handleUpdateCustomer = () => {
    if (!selectedCustomer) return;
    
    // Check permission
    if (!hasPermission('edit_users')) {
      toast.error(t("You don't have permission to edit users"));
      return;
    }
    
    // Remove email from updates - email cannot be modified
    const { email, ...updatesWithoutEmail } = formData;
    
    // Prevent admin from modifying their own role
    if (currentUser && selectedCustomer.id === currentUser.id) {
      const { role_id, ...updatesWithoutRole } = updatesWithoutEmail;
      updateMutation.mutate({
        id: selectedCustomer.id,
        updates: updatesWithoutRole,
      });
    } else {
      updateMutation.mutate({
        id: selectedCustomer.id,
        updates: updatesWithoutEmail,
      });
    }
  };

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: typeof newUserData) => {
      console.log("Creating user with data:", { ...data, password: "***" });
      
      // Check if user has permission to create users
      if (!hasPermission('create_users')) {
        throw new Error("You don't have permission to create users");
      }

      // Validate that role exists
      const selectedRole = roles.find((r: any) => r.id === data.role_id);
      if (!selectedRole) {
        throw new Error("Selected role not found");
      }

      // Validate password strength
      if (data.password.length < 12) {
        throw new Error("Password must be at least 12 characters long");
      }
      if (!/[A-Z]/.test(data.password)) {
        throw new Error("Password must contain at least one uppercase letter");
      }
      if (!/[a-z]/.test(data.password)) {
        throw new Error("Password must contain at least one lowercase letter");
      }
      if (!/[0-9]/.test(data.password)) {
        throw new Error("Password must contain at least one number");
      }
      if (!/[^A-Za-z0-9]/.test(data.password)) {
        throw new Error("Password must contain at least one special character");
      }
      
      console.log("Password validation passed");

      // Call edge function to create user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data: result, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: data.email,
          password: data.password,
          full_name: data.full_name,
          phone: data.phone,
          role_id: data.role_id
        }
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(t("User created successfully"));
      resetNewUserForm();
    },
    onError: (error: any) => {
      console.error("Create user error:", error);
      toast.error(t("Failed to create user"), { description: error.message || error.toString() });
    },
  });

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole =
      roleFilter === "all" ||
      customer.role_id === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Calculate stats
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.totalOrders > 0).length;
  const newThisMonth = customers.filter((c) => {
    const createdDate = new Date(c.created_at);
    const now = new Date();
    return (
      createdDate.getMonth() === now.getMonth() &&
      createdDate.getFullYear() === now.getFullYear()
    );
  }).length;
  const repeatCustomers = customers.filter((c) => c.totalOrders > 1).length;
  const repeatPercentage = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t("User Management")}</h1>
          <p className="text-muted-foreground">{t("View and manage all users")}</p>
        </div>
        <Button 
          onClick={() => {
            if (!hasPermission('create_users')) {
              toast.error(t("You don't have permission to create users"));
              return;
            }
            setIsAddUserDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> {t("Add User")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <UsersIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Total Customers")}</p>
                <p className="text-2xl font-bold">{totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Active Customers")}</p>
                <p className="text-2xl font-bold">{activeCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("New This Month")}</p>
                <p className="text-2xl font-bold">{newThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Repeat Customers")}</p>
                <p className="text-2xl font-bold">{repeatPercentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("Search by name or email...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("Filter by role")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Roles")}</SelectItem>
                {roles.map((r: any) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

          {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("Users")} ({paginatedData?.total || 0})
            {totalPages > 1 && <span className="text-sm text-muted-foreground ml-2">({t("Page")} {currentPage} {t("of")} {totalPages})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("No users found")}
            </div>
          ) : (
            <>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("User")}</TableHead>
                  <TableHead>{t("Contact")}</TableHead>
                  <TableHead>{t("Role")}</TableHead>
                  <TableHead>{t("Orders")}</TableHead>
                  <TableHead>{t("Total Spent")}</TableHead>
                  <TableHead>{t("Join Date")}</TableHead>
                  <TableHead>{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={getOptimizedImageUrl(customer.avatar_url, {
                              width: 80,
                              quality: 85,
                              format: 'webp'
                            }) || undefined}
                            alt={`${customer.full_name || customer.email || "User"} avatar`}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          <AvatarFallback>
                            {customer.full_name?.charAt(0) || customer.email?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{customer.full_name || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{customer.email || "N/A"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{customer.email || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{customer.phone || "N/A"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {customer.role?.name || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{customer.totalOrders}</TableCell>
                    <TableCell className="font-semibold">
                      {formatPrice(customer.totalSpent)}
                    </TableCell>
                    <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {hasPermission('view_users') && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleViewCustomer(customer)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission('edit_users') && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditCustomer(customer)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission('delete_users') && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            disabled={
                              (currentUser && customer.id === currentUser.id) ||
                              customer.role?.name?.toLowerCase() === 'super admin'
                            }
                            onClick={() => handleDeleteClick(customer.id, customer)}
                            title={
                              currentUser && customer.id === currentUser.id
                                ? t("Cannot delete your own account")
                                : customer.role?.name?.toLowerCase() === 'super admin'
                                ? t("Cannot delete super admin accounts")
                                : t("Delete user")
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  {t("Showing")} {((currentPage - 1) * ITEMS_PER_PAGE) + 1} {t("to")} {Math.min(currentPage * ITEMS_PER_PAGE, paginatedData?.total || 0)} {t("of")} {paginatedData?.total || 0} {t("users")}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    {t("Previous")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    {t("Next")}
                  </Button>
                </div>
              </div>
            )}
          </>
          )}
        </CardContent>
      </Card>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("User Details")}</DialogTitle>
            <DialogDescription>{t("View detailed information about this user")}</DialogDescription>
          </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={getOptimizedImageUrl(selectedCustomer.avatar_url, {
                        width: 96,
                        quality: 90,
                        format: 'webp'
                      }) || undefined}
                      alt={`${selectedCustomer.full_name || selectedCustomer.email || "User"} avatar`}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <AvatarFallback>
                      {selectedCustomer.full_name?.charAt(0) || selectedCustomer.email?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedCustomer.full_name || "N/A"}</p>
                    <p className="text-sm text-muted-foreground">{selectedCustomer.email || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold">{t("Full Name")}</Label>
                  <p className="mt-1">{selectedCustomer.full_name || "N/A"}</p>
                </div>
              <div>
                <Label className="text-sm font-semibold">{t("Phone")}</Label>
                <p className="mt-1">{selectedCustomer.phone || "N/A"}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">{t("Address")}</Label>
                <p className="mt-1">{selectedCustomer.address || "N/A"}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">{t("Total Orders")}</Label>
                <p className="mt-1">{selectedCustomer.totalOrders}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">{t("Total Spent")}</Label>
                <p className="mt-1">{formatPrice(selectedCustomer.totalSpent)}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">{t("Member Since")}</Label>
                <p className="mt-1">{new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>{t("Close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Edit User")}</DialogTitle>
            <DialogDescription>{t("Update user information")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-full-name">{t("Full Name")}</Label>
              <Input
                id="edit-full-name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder={t("Enter full name")}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">{t("Email")}</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted cursor-not-allowed"
                placeholder={t("Enter email")}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("Email cannot be modified")}
              </p>
            </div>
            <div>
              <Label htmlFor="edit-phone">{t("Phone")}</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t("Enter phone number")}
              />
            </div>
            <div>
              <Label htmlFor="edit-address">{t("Address")}</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={t("Enter address")}
              />
            </div>
            <div>
              <Label htmlFor="edit-role">{t("Role")}</Label>
              <Select 
                value={formData.role_id} 
                onValueChange={(value) => setFormData({ ...formData, role_id: value })}
                disabled={currentUser && selectedCustomer?.id === currentUser.id}
              >
                <SelectTrigger id="edit-role" className={currentUser && selectedCustomer?.id === currentUser.id ? "bg-muted cursor-not-allowed" : ""}>
                  <SelectValue placeholder={t("Select role")} />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map((r: any) => (
                    <SelectItem key={r.id} value={r.id} className="capitalize">
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentUser && selectedCustomer?.id === currentUser.id && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t("You cannot modify your own role")}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              {t("Cancel")}
            </Button>
            <Button onClick={handleUpdateCustomer} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t("Updating...") : t("Update User")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Are you sure?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("This action cannot be undone. This will permanently delete this user and all associated data.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Add New User")}</DialogTitle>
            <DialogDescription>{t("Create a new user account with a specific role")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="new-email">{t("Email")}</Label>
              <Input
                id="new-email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="new-password">{t("Password")}</Label>
              <Input
                id="new-password"
                type="password"
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                placeholder="••••••••"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("Password must be at least 12 characters and contain uppercase, lowercase, number, and special character")}
              </p>
            </div>
            <div>
              <Label htmlFor="new-full-name">{t("Full Name")}</Label>
              <Input
                id="new-full-name"
                value={newUserData.full_name}
                onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                placeholder={t("John Doe")}
              />
            </div>
            <div>
              <Label htmlFor="new-phone">{t("Phone")}</Label>
              <Input
                id="new-phone"
                type="tel"
                value={newUserData.phone}
                onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                placeholder={t("+963 999 999 999")}
              />
            </div>
            <div>
              <Label htmlFor="new-role">{t("Role")}</Label>
              <Select
                value={newUserData.role_id}
                onValueChange={(value) => setNewUserData({ ...newUserData, role_id: value })}
              >
                <SelectTrigger id="new-role">
                  <SelectValue placeholder={t("Select a role")} />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map((role: any) => (
                    <SelectItem key={role.id} value={role.id} className="capitalize">
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {t("Select the role for the new user")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetNewUserForm}>
              {t("Cancel")}
            </Button>
            <Button
              onClick={() => {
                console.log("Create User clicked", newUserData);
                if (!newUserData.email || !newUserData.password || !newUserData.role_id) {
                  toast.error(t("Please fill in all required fields"));
                  return;
                }
                createUserMutation.mutate(newUserData);
              }}
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? t("Creating...") : t("Create User")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
