import { Save, Shield, Bell, Globe, Palette, User } from "lucide-react";
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
import { Loader2 } from "lucide-react";

const Settings = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
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
  const [physicalAddress, setPhysicalAddress] = useState("");
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
      if (!isAdmin) return;

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
          setPhysicalAddress(data.physical_address || "");
          setEmailResponseTime(data.email_response_time || "");
          setWhatsappDescription(data.whatsapp_description || "");
          setLocationDescription(data.location_description || "");
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error loading store settings:", error);
        }
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
          physical_address: physicalAddress,
          email_response_time: emailResponseTime,
          whatsapp_description: whatsappDescription,
          location_description: locationDescription,
        })
        .eq('id', storeSettingsId);

      if (error) throw error;

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

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage store and account settings</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                placeholder="Enter your full name" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              placeholder="+963 123 456 789" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button className="gap-2" onClick={handleSaveProfile} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
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
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage password and security</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current">Current Password</Label>
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
              <Label htmlFor="new">New Password</Label>
              <Input 
                id="new" 
                type="password" 
                placeholder="••••••••" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
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
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            Update Password
          </Button>
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
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage notification preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New Order Notifications</p>
              <p className="text-sm text-muted-foreground">Receive alerts when new orders arrive</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Low Stock Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified when products are running low</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Payment Notifications</p>
              <p className="text-sm text-muted-foreground">Receive updates about financial transactions</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Newsletter</p>
              <p className="text-sm text-muted-foreground">Receive latest news and updates</p>
            </div>
            <Switch />
          </div>
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
                <CardTitle>Store Settings</CardTitle>
                <CardDescription>Manage store contact information and social media</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeEmail">Store Email</Label>
              <Input 
                id="storeEmail" 
                type="email" 
                value={storeEmail}
                onChange={(e) => setStoreEmail(e.target.value)}
                placeholder="info@peaksyria.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storePhone">Store Phone</Label>
              <Input 
                id="storePhone" 
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                placeholder="+963 XXX XXX XXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessHours">Business Hours</Label>
              <Input 
                id="businessHours" 
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                placeholder="Mon-Sat, 9AM-8PM"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
              <Input 
                id="whatsappNumber" 
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="963XXXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsappDescription">WhatsApp Description</Label>
              <Input 
                id="whatsappDescription" 
                value={whatsappDescription}
                onChange={(e) => setWhatsappDescription(e.target.value)}
                placeholder="Quick responses guaranteed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailResponseTime">Email Response Time</Label>
              <Input 
                id="emailResponseTime" 
                value={emailResponseTime}
                onChange={(e) => setEmailResponseTime(e.target.value)}
                placeholder="We'll reply within 24 hours"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="physicalAddress">Physical Address</Label>
              <Input 
                id="physicalAddress" 
                value={physicalAddress}
                onChange={(e) => setPhysicalAddress(e.target.value)}
                placeholder="Damascus, Syria"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationDescription">Location Description</Label>
              <Input 
                id="locationDescription" 
                value={locationDescription}
                onChange={(e) => setLocationDescription(e.target.value)}
                placeholder="Visit us at our showroom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandDescription">Brand Description</Label>
              <Textarea
                id="brandDescription"
                value={brandDescription}
                onChange={(e) => setBrandDescription(e.target.value)}
                placeholder="Official distributor of PEAK sportswear in Syria..."
                rows={3}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="facebookUrl">Facebook URL</Label>
              <Input 
                id="facebookUrl" 
                type="url"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram URL</Label>
              <Input 
                id="instagramUrl" 
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/yourpage"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitterUrl">Twitter URL</Label>
              <Input 
                id="twitterUrl" 
                type="url"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="https://twitter.com/yourpage"
              />
            </div>
            <Button className="gap-2" onClick={handleSaveStoreSettings} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Store Settings
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-500/10 rounded-full flex items-center justify-center">
              <Palette className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize dashboard appearance</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">Enable dark theme for the interface</p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Language</p>
              <p className="text-sm text-muted-foreground">English</p>
            </div>
            <Button variant="outline" size="sm">
              Change
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
