import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
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

interface Permission {
  id: string;
  name: string;
  description: string | null;
  category: string;
}

interface Role {
  id: string;
  name: string;
  created_at: string;
}

interface RoleWithPermissions {
  id: string;
  name: string;
  permissions: Permission[];
  userCount: number;
}

const Roles = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const reservedRoleNames = ["super admin", "customer"];

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Fetch all permissions
  const { data: allPermissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Permission[];
    },
  });

  // Fetch roles with permissions
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      // Get all roles
      const { data: allRoles, error: rolesError } = await supabase
        .from("roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Get permissions and user count for each role
      const rolesWithData = await Promise.all(
        (allRoles || []).map(async (role) => {
          // Get permissions for this role
          const { data: rolePerms } = await supabase
            .from("role_permissions")
            .select(`
              permission_id,
              permissions (
                id,
                name,
                description,
                category
              )
            `)
            .eq("role_id", role.id);

          // Get user count for this role
          const { count } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("role_id", role.id);

          const permissions = rolePerms?.map((rp: any) => rp.permissions).filter(Boolean) || [];

          return {
            id: role.id,
            name: role.name,
            permissions,
            userCount: count || 0,
          };
        })
      );

      // Sort roles: super admin first, customer second, then the rest
      const sortedRoles = rolesWithData.sort((a, b) => {
        const aLower = a.name.toLowerCase();
        const bLower = b.name.toLowerCase();
        
        if (aLower === 'super admin') return -1;
        if (bLower === 'super admin') return 1;
        if (aLower === 'customer') return -1;
        if (bLower === 'customer') return 1;
        
        return a.name.localeCompare(b.name);
      });

      return sortedRoles as RoleWithPermissions[];
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; permissionIds: string[] }) => {
      const cleaned = data.name.trim();
      if (!cleaned) throw new Error("Role name is required");
      if (reservedRoleNames.includes(cleaned.toLowerCase())) {
        throw new Error("This role name is reserved");
      }
      
      // Insert the role
      const { data: newRole, error: roleError } = await supabase
        .from("roles")
        .insert({ name: cleaned })
        .select()
        .single();
      
      if (roleError) throw roleError;
      
      // Insert permissions if any selected
      if (data.permissionIds.length > 0 && newRole) {
        const { error: permError } = await supabase
          .from("role_permissions")
          .insert(
            data.permissionIds.map((permId) => ({
              role_id: newRole.id,
              permission_id: permId,
            }))
          );
        
        if (permError) throw permError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success(t("Role created with permissions"));
      setIsAddDialogOpen(false);
      setNewRoleName("");
      setSelectedPermissions([]);
    },
    onError: (error: any) => {
      toast.error(t("Failed to create role"), { description: error.message });
    },
  });

  // Rename role mutation
  const renameRoleMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const cleaned = name.trim();
      if (!cleaned) throw new Error("Role name is required");
      if (reservedRoleNames.includes(cleaned.toLowerCase())) {
        throw new Error("This role name is reserved");
      }
      const { error } = await supabase.from("roles").update({ name: cleaned }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success(t("Role renamed"));
      setIsRenameDialogOpen(false);
      setSelectedRole(null);
      setRenameValue("");
    },
    onError: (error: any) => {
      toast.error(t("Failed to rename role"), { description: error.message });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from("roles").delete().eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success(t("Role deleted successfully"));
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    },
    onError: (error: any) => {
      toast.error(t("Failed to delete role"), { description: error.message });
    },
  });

  // Update role permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: { roleId: string; permissionIds: string[] }) => {
      // Delete existing permissions for this role
      const { error: deleteError } = await supabase
        .from("role_permissions")
        .delete()
        .eq("role_id", data.roleId);

      if (deleteError) throw deleteError;

      // Insert new permissions
      if (data.permissionIds.length > 0) {
        const { error: insertError } = await supabase
          .from("role_permissions")
          .insert(
            data.permissionIds.map((permId) => ({
              role_id: data.roleId,
              permission_id: permId,
            }))
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success(t("Role permissions updated successfully"));
      setIsEditDialogOpen(false);
      setSelectedRole(null);
      setSelectedPermissions([]);
    },
    onError: (error: any) => {
      toast.error(t("Failed to update role permissions"), {
        description: error.message,
      });
    },
  });

  const handleEditRole = (role: RoleWithPermissions) => {
    setSelectedRole({ id: role.id, name: role.name, created_at: '' });
    setSelectedPermissions(role.permissions.map((p) => p.id));
    setIsEditDialogOpen(true);
  };

  const handleUpdatePermissions = () => {
    if (!selectedRole) return;
    updatePermissionsMutation.mutate({
      roleId: selectedRole.id,
      permissionIds: selectedPermissions,
    });
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleCategoryPermissions = (category: string) => {
    const categoryPerms = permissionsByCategory[category] || [];
    const categoryPermIds = categoryPerms.map((p) => p.id);
    const allSelected = categoryPermIds.every((id) => selectedPermissions.includes(id));
    
    if (allSelected) {
      // Unselect all in category
      setSelectedPermissions((prev) => prev.filter((id) => !categoryPermIds.includes(id)));
    } else {
      // Select all in category
      setSelectedPermissions((prev) => [...new Set([...prev, ...categoryPermIds])]);
    }
  };

  // Group permissions by category
  const permissionsByCategory = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t("Role Management")}</h1>
          <p className="text-muted-foreground">{t("Manage roles and permissions")}</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> {t("Add Role")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Total Roles")}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{roles.length}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Total Permissions")}</p>
                {permissionsLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{allPermissions.length}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Permission Categories")}</p>
                {permissionsLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{Object.keys(permissionsByCategory).length}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("Roles")} ({roles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{t("Description")}</TableHead>
                  <TableHead>{t("Users")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead>{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
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
          ) : roles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("No roles found")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Role")}</TableHead>
                  <TableHead>{t("Users")}</TableHead>
                  <TableHead>{t("Permissions")}</TableHead>
                  <TableHead>{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">{role.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{role.userCount}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap max-w-md">
                        {(role.permissions ?? []).slice(0, 3).map((perm) => (
                          <Badge key={perm.id} variant="secondary" className="text-xs">
                            {perm.name}
                          </Badge>
                        ))}
                        {((role.permissions?.length ?? 0) > 3) && (
                          <Badge variant="outline" className="text-xs">
                            +{(role.permissions?.length ?? 0) - 3} {t("more")}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditRole(role)}
                          aria-label={t("Edit permissions")}
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={reservedRoleNames.includes(role.name.toLowerCase())}
                          onClick={() => {
                            setSelectedRole({ id: role.id, name: role.name, created_at: '' });
                            setRenameValue(role.name);
                            setIsRenameDialogOpen(true);
                          }}
                        >
                          {t("Rename")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={reservedRoleNames.includes(role.name.toLowerCase())}
                          onClick={() => {
                            setRoleToDelete({ id: role.id, name: role.name, created_at: '' });
                            setDeleteDialogOpen(true);
                          }}
                          aria-label={t("Delete role")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Permissions Box */}
      <Card>
        <CardHeader>
          <CardTitle>{t("Permissions")} ({allPermissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {permissionsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-muted/50">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(permissionsByCategory).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("No permissions found")}
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                <div key={category} className="border rounded-lg overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-3 bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => toggleCategory(category)}
                  >
                    <span className="font-medium capitalize">{category}</span>
                    <Badge variant="secondary">{permissions.length} {t("permissions")}</Badge>
                  </div>
                  {expandedCategories.includes(category) && (
                    <div className="p-3 space-y-2 border-t">
                      {permissions.map((perm) => (
                        <div key={perm.id} className="flex flex-col gap-1">
                          <span className="text-sm font-medium">{perm.name}</span>
                          {perm.description && (
                            <span className="text-xs text-muted-foreground">{perm.description}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Permissions Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Edit Role Permissions")}</DialogTitle>
            <DialogDescription>
              {t("Select permissions for the")} <span className="font-semibold capitalize">{selectedRole?.name}</span> {t("role")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {Object.entries(permissionsByCategory).map(([category, permissions]) => {
              const categoryPermIds = permissions.map((p) => p.id);
              const allCategorySelected = categoryPermIds.every((id) => selectedPermissions.includes(id));
              
              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`category-${category}`}
                      checked={allCategorySelected}
                      onCheckedChange={() => toggleCategoryPermissions(category)}
                    />
                    <Label htmlFor={`category-${category}`} className="font-semibold text-sm cursor-pointer capitalize">
                      {category}
                    </Label>
                  </div>
                  <div className="space-y-2 pl-4">
                  {permissions.map((perm) => (
                    <div key={perm.id} className="flex items-start gap-3">
                      <Checkbox
                        id={perm.id}
                        checked={selectedPermissions.includes(perm.id)}
                        onCheckedChange={() => togglePermission(perm.id)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={perm.id} className="cursor-pointer font-normal">
                          {perm.name}
                        </Label>
                        {perm.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {perm.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
            })}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedRole(null);
                setSelectedPermissions([]);
              }}
            >
              {t("Cancel")}
            </Button>
            <Button onClick={handleUpdatePermissions} disabled={updatePermissionsMutation.isPending}>
              {updatePermissionsMutation.isPending ? t("Updating...") : t("Update Permissions")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Role Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) {
          setNewRoleName("");
          setSelectedPermissions([]);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Add Role")}</DialogTitle>
            <DialogDescription>{t("Create a new role and assign permissions")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="role-name">{t("Role name")}</Label>
              <Input 
                id="role-name" 
                value={newRoleName} 
                onChange={(e) => setNewRoleName(e.target.value)} 
                placeholder={t("e.g. manager")} 
              />
            </div>
            <div className="space-y-4">
              <Label>{t("Permissions")}</Label>
              {Object.entries(permissionsByCategory).map(([category, permissions]) => {
                const categoryPermIds = permissions.map((p) => p.id);
                const allCategorySelected = categoryPermIds.every((id) => selectedPermissions.includes(id));
                
                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`add-category-${category}`}
                        checked={allCategorySelected}
                        onCheckedChange={() => toggleCategoryPermissions(category)}
                      />
                      <Label htmlFor={`add-category-${category}`} className="font-semibold text-sm cursor-pointer capitalize">
                        {category}
                      </Label>
                    </div>
                    <div className="space-y-2 pl-4">
                    {permissions.map((perm) => (
                      <div key={perm.id} className="flex items-start gap-3">
                        <Checkbox
                          id={`add-${perm.id}`}
                          checked={selectedPermissions.includes(perm.id)}
                          onCheckedChange={() => togglePermission(perm.id)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={`add-${perm.id}`} className="cursor-pointer font-normal">
                            {perm.name}
                          </Label>
                          {perm.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {perm.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>{t("Cancel")}</Button>
            <Button 
              onClick={() => createRoleMutation.mutate({ name: newRoleName, permissionIds: selectedPermissions })} 
              disabled={createRoleMutation.isPending || !newRoleName.trim()}
            >
              {createRoleMutation.isPending ? t("Creating...") : t("Create Role")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Role Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Rename Role")}</DialogTitle>
            <DialogDescription>{t("Change the role name")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rename-role">{t("New name")}</Label>
              <Input id="rename-role" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>{t("Cancel")}</Button>
            <Button onClick={() => selectedRole && renameRoleMutation.mutate({ id: selectedRole.id, name: renameValue })} disabled={renameRoleMutation.isPending || (selectedRole ? reservedRoleNames.includes(selectedRole.name.toLowerCase()) : false)}>
              {renameRoleMutation.isPending ? t("Saving...") : t("Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete Role")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Are you sure you want to delete the role")} "{roleToDelete?.name}"? {t("This action cannot be undone.")}
              {" "}{t("Users with this role will need to be reassigned.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => roleToDelete && deleteRoleMutation.mutate(roleToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRoleMutation.isPending ? t("Deleting...") : t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Roles;
