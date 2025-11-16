import { Save, Shield, Bell, Globe, Palette, User, Plus, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

const Settings = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingStoreSettings, setLoadingStoreSettings] = useState(true);
  
  // Account Information State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  // Store Settings State
  const [storeSettingsId, setStoreSettingsId] = useState<string | null>(null);
  const [storeEmail, setStoreEmail] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [businessHours, setBusinessHours] = useState("");
  const [physicalAddresses, setPhysicalAddresses] = useState<string[]>([]);
  const [emailResponseTime, setEmailResponseTime] = useState("");
  const [whatsappDescription, setWhatsappDescription] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  
  // Security State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Load user profile and store settings
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setFullName(data.full_name || "");
          setEmail(data.email || user.email || "");
          setPhone(data.phone || "");
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error loading profile:", error);
        }
        toast.error(t("Failed to load profile"));
      } finally {
        setLoadingProfile(false);
      }
    };

    const loadStoreSettings = async () => {
      if (!isAdmin) {
        setLoadingStoreSettings(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setStoreSettingsId(data.id);
          setStoreEmail(data.store_email || "");
          setStorePhone(data.store_phone || "");
          setWhatsappNumber(data.whatsapp_number || "");
          setBrandDescription(data.brand_description || "");
          setFacebookUrl(data.facebook_url || "");
          setInstagramUrl(data.instagram_url || "");
          setTwitterUrl(data.twitter_url || "");
          setBusinessHours(data.business_hours || "");
          // Parse physical_address as JSON array, fallback to single string
          try {
            const parsed = data.physical_address ? JSON.parse(data.physical_address) : [];
            if (Array.isArray(parsed) && parsed.length > 0) {
              setPhysicalAddresses(parsed);
            } else if (typeof data.physical_address === 'string' && data.physical_address.trim()) {
              // If it's a plain string (old format), convert to array
              setPhysicalAddresses([data.physical_address]);
            } else {
              setPhysicalAddresses([]);
            }
          } catch {
            // If parsing fails, treat as single string
            if (data.physical_address && typeof data.physical_address === 'string') {
              setPhysicalAddresses([data.physical_address]);
            } else {
              // Ensure at least one empty address field
              setPhysicalAddresses([""]);
            }
          }
          setEmailResponseTime(data.email_response_time || "");
          setWhatsappDescription(data.whatsapp_description || "");
          setLocationDescription(data.location_description || "");
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error loading store settings:", error);
        }
      } finally {
        setLoadingStoreSettings(false);
      }
    };

    loadProfile();
    loadStoreSettings();
  }, [user, isAdmin]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(t("Profile updated successfully"));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error updating profile:", error);
      }
      toast.error(t("Failed to update profile"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      toast.error(t("Please enter your current password"));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t("New passwords do not match"));
      return;
    }

    if (newPassword.length < 12) {
      toast.error(t("Password must be at least 12 characters"));
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      toast.error(t("Password must contain at least one uppercase letter"));
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      toast.error(t("Password must contain at least one lowercase letter"));
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      toast.error(t("Password must contain at least one number"));
      return;
    }

    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      toast.error(t("Password must contain at least one special character"));
      return;
    }

    setLoading(true);
    try {
      // Verify current password first
      if (!user?.email) {
        throw new Error("User email not found");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast.error(t("Current password is incorrect"));
        setLoading(false);
        return;
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success(t("Password updated successfully. Please sign in again with your new password."));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error updating password:", error);
      }
      toast.error(t("Failed to update password"));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStoreSettings = async () => {
    if (!storeSettingsId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('store_settings')
        .update({
          store_email: storeEmail,
          store_phone: storePhone,
          whatsapp_number: whatsappNumber,
          brand_description: brandDescription,
          facebook_url: facebookUrl,
          instagram_url: instagramUrl,
          twitter_url: twitterUrl,
          business_hours: businessHours,
          physical_address: (() => {
            // Filter out empty addresses before saving
            const validAddresses = physicalAddresses.filter(addr => addr && addr.trim().length > 0);
            return validAddresses.length > 0 ? JSON.stringify(validAddresses) : null;
          })(),
          email_response_time: emailResponseTime,
          whatsapp_description: whatsappDescription,
          location_description: locationDescription,
        })
        .eq('id', storeSettingsId);

      if (error) throw error;

      // Invalidate store-settings query to refresh data in Contact page
      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
      
      toast.success(t("Store settings updated successfully"));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error updating store settings:", error);
      }
      toast.error(t("Failed to update store settings"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{t("Settings")}</h1>
        <p className="text-muted-foreground">{t("Manage store and account settings")}</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>{t("Account Information")}</CardTitle>
              <CardDescription>{t("Update your profile information")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingProfile ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("Full Name")}</Label>
                  <Input 
                    id="name" 
                    placeholder={t("Enter your full name")} 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("Email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    disabled
                    className="opacity-60"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("Phone Number")}</Label>
                <Input 
                  id="phone" 
                  placeholder={t("+963 123 456 789")} 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <Button className="gap-2" onClick={handleSaveProfile} disabled={loading}>
                <Save className="h-4 w-4" />
                {t("Save Changes")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-red-500/10 rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <CardTitle>{t("Security")}</CardTitle>
              <CardDescription>{t("Manage password and security")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingProfile ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <Skeleton className="h-10 w-40" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="current">{t("Current Password")}</Label>
                <Input 
                  id="current" 
                  type="password" 
                  placeholder="••••••••" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new">{t("New Password")}</Label>
                  <Input 
                    id="new" 
                    type="password" 
                    placeholder="••••••••" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">{t("Confirm Password")}</Label>
                  <Input 
                    id="confirm" 
                    type="password" 
                    placeholder="••••••••" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button variant="destructive" className="gap-2" onClick={handleUpdatePassword} disabled={loading}>
                <Shield className="h-4 w-4" />
                {t("Update Password")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Bell className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle>{t("Notifications")}</CardTitle>
              <CardDescription>{t("Manage notification preferences")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingProfile ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-6 w-12" />
                  </div>
                  {i < 3 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t("New Order Notifications")}</p>
                  <p className="text-sm text-muted-foreground">{t("Receive alerts when new orders arrive")}</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t("Low Stock Alerts")}</p>
                  <p className="text-sm text-muted-foreground">{t("Get notified when products are running low")}</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t("Payment Notifications")}</p>
                  <p className="text-sm text-muted-foreground">{t("Receive updates about financial transactions")}</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t("Newsletter")}</p>
                  <p className="text-sm text-muted-foreground">{t("Receive latest news and updates")}</p>
                </div>
                <Switch />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Store Settings - Admin Only */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-500/10 rounded-full flex items-center justify-center">
                <Globe className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle>{t("Store Settings")}</CardTitle>
                <CardDescription>{t("Manage store contact information and social media")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingStoreSettings ? (
              <div className="space-y-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    {i === 8 ? (
                      <Skeleton className="h-20 w-full" />
                    ) : (
                      <Skeleton className="h-10 w-full" />
                    )}
                  </div>
                ))}
                <Skeleton className="h-10 w-40" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="storeEmail">{t("Store Email")}</Label>
                  <Input 
                    id="storeEmail" 
                    type="email" 
                    value={storeEmail}
                    onChange={(e) => setStoreEmail(e.target.value)}
                    placeholder="info@peaksyria.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storePhone">{t("Store Phone")}</Label>
                  <Input 
                    id="storePhone" 
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    placeholder="+963 XXX XXX XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessHours">{t("Business Hours")}</Label>
                  <Input 
                    id="businessHours" 
                    value={businessHours}
                    onChange={(e) => setBusinessHours(e.target.value)}
                    placeholder={t("Mon-Sat, 9AM-8PM")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">{t("WhatsApp Number")}</Label>
                  <Input 
                    id="whatsappNumber" 
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="963XXXXXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappDescription">{t("WhatsApp Description")}</Label>
                  <Input 
                    id="whatsappDescription" 
                    value={whatsappDescription}
                    onChange={(e) => setWhatsappDescription(e.target.value)}
                    placeholder={t("Quick responses guaranteed")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailResponseTime">{t("Email Response Time")}</Label>
                  <Input 
                    id="emailResponseTime" 
                    value={emailResponseTime}
                    onChange={(e) => setEmailResponseTime(e.target.value)}
                    placeholder={t("We'll reply within 24 hours")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("Physical Addresses")}</Label>
                  <div className="space-y-3">
                    {physicalAddresses.map((address, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Input 
                            value={address}
                            onChange={(e) => {
                              const newAddresses = [...physicalAddresses];
                              newAddresses[index] = e.target.value;
                              setPhysicalAddresses(newAddresses);
                            }}
                            placeholder={t("Damascus, Syria")}
                            className="w-full"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            const newAddresses = physicalAddresses.filter((_, i) => i !== index);
                            setPhysicalAddresses(newAddresses);
                          }}
                          disabled={physicalAddresses.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPhysicalAddresses([...physicalAddresses, ""])}
                      className="w-full gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      {t("Add Address")}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("Add multiple branch locations. Each address will be displayed separately.")}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="locationDescription">{t("Location Description")}</Label>
                    <span className="text-xs text-muted-foreground">
                      ({t("This description will only appear for the first branch (main branch)")})
                    </span>
                  </div>
                  <Input 
                    id="locationDescription" 
                    value={locationDescription}
                    onChange={(e) => setLocationDescription(e.target.value)}
                    placeholder={t("Visit us at our showroom")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brandDescription">{t("Brand Description")}</Label>
                  <Textarea
                    id="brandDescription"
                    value={brandDescription}
                    onChange={(e) => setBrandDescription(e.target.value)}
                    placeholder={t("Official distributor of PEAK sportswear in Syria...")}
                    rows={3}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="facebookUrl">{t("Facebook URL")}</Label>
                  <Input 
                    id="facebookUrl" 
                    type="url"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagramUrl">{t("Instagram URL")}</Label>
                  <Input 
                    id="instagramUrl" 
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/yourpage"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitterUrl">{t("Twitter URL")}</Label>
                  <Input 
                    id="twitterUrl" 
                    type="url"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    placeholder="https://twitter.com/yourpage"
                  />
                </div>
                <Button className="gap-2" onClick={handleSaveStoreSettings} disabled={loading}>
                  <Save className="h-4 w-4" />
                  {t("Save Store Settings")}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      
    </div>
  );
};

export default Settings;
