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
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Fetch all roles for the filter
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
      toast.success("User updated successfully");
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Failed to update customer", {
        description: error.message,
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to delete customer", {
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
    setNewUserData({ email: "", password: "", full_name: "", role_id: "" });
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
    // Prevent deleting yourself
    if (currentUser && id === currentUser.id) {
      toast.error("Cannot delete your own account");
      return;
    }
    
    // Prevent deleting super admin
    if (customer.role?.name?.toLowerCase() === 'super admin') {
      toast.error("Cannot delete super admin accounts");
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
    updateMutation.mutate({
      id: selectedCustomer.id,
      updates: formData,
    });
  };

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: typeof newUserData) => {
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

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // Update the profile with role_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role_id: data.role_id })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully");
      resetNewUserForm();
    },
    onError: (error: any) => {
      toast.error("Failed to create user", { description: error.message });
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
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">View and manage all users</p>
        </div>
        <Button onClick={() => setIsAddUserDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add User
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
                <p className="text-sm text-muted-foreground">Total Customers</p>
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
                <p className="text-sm text-muted-foreground">Active Customers</p>
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
                <p className="text-sm text-muted-foreground">New This Month</p>
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
                <p className="text-sm text-muted-foreground">Repeat Customers</p>
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
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
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
            Users ({paginatedData?.total || 0})
            {totalPages > 1 && <span className="text-sm text-muted-foreground ml-2">(Page {currentPage} of {totalPages})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading users...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          ) : (
            <>
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
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={customer.avatar_url || undefined}
                            alt={`${customer.full_name || customer.email || "User"} avatar`}
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
                      ${customer.totalSpent.toFixed(2)}
                    </TableCell>
                    <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
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
                              ? "Cannot delete your own account"
                              : customer.role?.name?.toLowerCase() === 'super admin'
                              ? "Cannot delete super admin accounts"
                              : "Delete user"
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, paginatedData?.total || 0)} of {paginatedData?.total || 0} users
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
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
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={selectedCustomer.avatar_url || undefined}
                      alt={`${selectedCustomer.full_name || selectedCustomer.email || "User"} avatar`}
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
                  <Label className="text-sm font-semibold">Full Name</Label>
                  <p className="mt-1">{selectedCustomer.full_name || "N/A"}</p>
                </div>
              <div>
                <Label className="text-sm font-semibold">Phone</Label>
                <p className="mt-1">{selectedCustomer.phone || "N/A"}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Address</Label>
                <p className="mt-1">{selectedCustomer.address || "N/A"}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Total Orders</Label>
                <p className="mt-1">{selectedCustomer.totalOrders}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Total Spent</Label>
                <p className="mt-1">${selectedCustomer.totalSpent.toFixed(2)}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Member Since</Label>
                <p className="mt-1">{new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-full-name">Full Name</Label>
              <Input
                id="edit-full-name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select 
                value={formData.role_id} 
                onValueChange={(value) => setFormData({ ...formData, role_id: value })}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r: any) => (
                    <SelectItem key={r.id} value={r.id} className="capitalize">
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              Cancel
            </Button>
            <Button onClick={handleUpdateCustomer} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this user
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account with a specific role</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="new-password">Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label htmlFor="new-full-name">Full Name</Label>
              <Input
                id="new-full-name"
                value={newUserData.full_name}
                onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="new-role">Role</Label>
              <Select
                value={newUserData.role_id}
                onValueChange={(value) => setNewUserData({ ...newUserData, role_id: value })}
              >
                <SelectTrigger id="new-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role: any) => (
                    <SelectItem key={role.id} value={role.id} className="capitalize">
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetNewUserForm}>
              Cancel
            </Button>
            <Button
              onClick={() => createUserMutation.mutate(newUserData)}
              disabled={
                createUserMutation.isPending ||
                !newUserData.email ||
                !newUserData.password ||
                !newUserData.role_id
              }
            >
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
