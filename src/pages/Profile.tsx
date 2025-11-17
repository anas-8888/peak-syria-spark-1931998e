import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, Mail, Phone, MapPin, User, Navigation } from "lucide-react";
import { getOptimizedImageUrl } from "@/utils/imageCache";
import { useQueryClient } from "@tanstack/react-query";

const Profile = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("963"); // Default: Syria
  const [phoneLocalNumber, setPhoneLocalNumber] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
const [regionId, setRegionId] = useState<string | undefined>(undefined);
const regionTouchedRef = useRef(false);
const [regions, setRegions] = useState<Array<{ id: string; name: string; country: string }>>([]);
  const [avatarKey, setAvatarKey] = useState(Date.now());

  // Country codes with flags
  const countryCodes = [
    { code: "963", name: "Syria", flag: "https://flagcdn.com/16x12/sy.png" },
    { code: "961", name: "Lebanon", flag: "https://flagcdn.com/16x12/lb.png" },
    { code: "962", name: "Jordan", flag: "https://flagcdn.com/16x12/jo.png" },
    { code: "966", name: "Saudi Arabia", flag: "https://flagcdn.com/16x12/sa.png" },
    { code: "971", name: "UAE", flag: "https://flagcdn.com/16x12/ae.png" },
    { code: "965", name: "Kuwait", flag: "https://flagcdn.com/16x12/kw.png" },
    { code: "974", name: "Qatar", flag: "https://flagcdn.com/16x12/qa.png" },
    { code: "973", name: "Bahrain", flag: "https://flagcdn.com/16x12/bh.png" },
    { code: "968", name: "Oman", flag: "https://flagcdn.com/16x12/om.png" },
    { code: "967", name: "Yemen", flag: "https://flagcdn.com/16x12/ye.png" },
    { code: "964", name: "Iraq", flag: "https://flagcdn.com/16x12/iq.png" },
    { code: "20", name: "Egypt", flag: "https://flagcdn.com/16x12/eg.png" },
    { code: "1", name: "USA/Canada", flag: "https://flagcdn.com/16x12/us.png" },
    { code: "44", name: "UK", flag: "https://flagcdn.com/16x12/gb.png" },
    { code: "33", name: "France", flag: "https://flagcdn.com/16x12/fr.png" },
    { code: "49", name: "Germany", flag: "https://flagcdn.com/16x12/de.png" },
    { code: "90", name: "Turkey", flag: "https://flagcdn.com/16x12/tr.png" },
  ];

  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadRegions();
    }
  }, [user]);

  const loadRegions = async () => {
    try {
      const { data, error } = await supabase
        .from("regions")
        .select("id, name, country")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      if (data) setRegions(data);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error loading regions:", error);
      }
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      if (data) {
        // Auto-populate from Google profile
        const googleName = user?.user_metadata?.full_name || user?.user_metadata?.name || "";
        const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";
        
        setFullName(data.full_name || googleName);
        setEmail(data.email || user?.email || "");
        setAddress(data.address || "");
        
        // Parse phone number if exists
        if (data.phone && data.phone.trim() !== "") {
          // Parse phone: format is 0 + country code + local number
          // Example: 0963964594375 = 0 + 963 + 964594375
          const phoneStr = data.phone.trim();
          if (phoneStr.startsWith("0") && phoneStr.length > 3) {
            // Extract country code (try 3 digits first, then 2, then 1)
            let found = false;
            for (let len = 3; len >= 1 && !found; len--) {
              const possibleCode = phoneStr.substring(1, 1 + len);
              const country = countryCodes.find(c => c.code === possibleCode);
              if (country) {
                setPhoneCountryCode(country.code);
                setPhoneLocalNumber(phoneStr.substring(1 + len));
                setPhone(data.phone); // Keep full phone for display
                found = true;
              }
            }
            if (!found) {
              // Default to Syria if can't parse
              setPhoneCountryCode("963");
              setPhoneLocalNumber(phoneStr.substring(1));
              setPhone(data.phone);
            }
          } else {
            setPhone(data.phone);
            // Try to extract country code from existing format
            const country = countryCodes.find(c => phoneStr.startsWith(`+${c.code}`) || phoneStr.startsWith(c.code));
            if (country) {
              setPhoneCountryCode(country.code);
              setPhoneLocalNumber(phoneStr.replace(`+${country.code}`, "").replace(country.code, "").trim());
            }
          }
        } else {
          setPhone("");
          setPhoneLocalNumber("");
          // Default to Syria (+963) for new users
          setPhoneCountryCode("963");
        }
        
        // Check if this is a first-time user (no phone number)
        if (!data.phone || data.phone.trim() === "") {
          setIsFirstTimeUser(true);
          toast({
            title: t("Welcome! 👋"),
            description: t("Please complete your profile to start shopping"),
          });
        }
        
        // Use avatar URL without timestamp to allow browser caching
        const avatarUrlToUse = data.avatar_url || googleAvatar || "";
        setAvatarUrl(avatarUrlToUse);
        
// Set region_id from database only if user hasn't changed it yet
if (!regionTouchedRef.current) {
  setRegionId(data.region_id || undefined);
}
        
        // Pre-fill form with Google data if profile is empty, but don't auto-save
        // User can review and save explicitly
        if (!data.full_name && googleName) {
          setFullName(googleName);
        }
        if (!data.avatar_url && googleAvatar) {
          setAvatarUrl(googleAvatar);
        }
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error loading profile:", error);
      }
      toast({
        title: t("Failed to load profile"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${user?.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split("/").pop();
        if (oldPath) {
          await supabase.storage.from("avatars").remove([`${user?.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL (without timestamp to allow browser caching)
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const optimizedAvatarUrl = getOptimizedImageUrl(urlData.publicUrl, {
        width: 200,
        quality: 90,
        format: 'webp'
      });

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", user?.id);

      if (updateError) throw updateError;

      // Update local state with optimized URL
      setAvatarUrl(optimizedAvatarUrl);
      setAvatarKey(Date.now());
      
      // Invalidate profile cache in React Query
      queryClient.invalidateQueries({ queryKey: ["user-profile", user?.id] });
      
      // Trigger a custom event to notify Navbar to refresh
      window.dispatchEvent(new CustomEvent('avatarUpdated'));
      
      toast({
        title: t("Avatar Updated! 📸"),
        description: t("Your profile picture has been updated successfully"),
      });
    } catch (error: any) {
      toast({
        title: t("Upload Failed"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleGetLocation = () => {
    setLoadingLocation(true);
    if ("geolocation" in navigator) {
      // Clear any cached position first by calling watchPosition briefly
      const watchId = navigator.geolocation.watchPosition(() => {});
      navigator.geolocation.clearWatch(watchId);
      
      // Force fresh location by disabling cache and enabling high accuracy
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Use reverse geocoding to get address with fresh data
            // Add timestamp to prevent caching
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&timestamp=${Date.now()}`,
              {
                headers: {
                  'Cache-Control': 'no-cache',
                  'Pragma': 'no-cache',
                }
              }
            );
            const data = await response.json();
            
            if (data.display_name) {
              setAddress(data.display_name);
              
              // Try to match region based on location data
              const locationCountry = data.address?.country || "";
              const locationState = data.address?.state || "";
              const locationCity = data.address?.city || data.address?.town || "";
              
              // Find matching region
              const matchedRegion = regions.find(region => 
                region.name.toLowerCase().includes(locationCity.toLowerCase()) ||
                region.name.toLowerCase().includes(locationState.toLowerCase()) ||
                locationCity.toLowerCase().includes(region.name.toLowerCase()) ||
                locationState.toLowerCase().includes(region.name.toLowerCase())
              );
              
              if (matchedRegion) {
                setRegionId(matchedRegion.id);
                toast({
                  title: t("Location and region detected successfully!"),
                });
              } else {
                toast({
                  title: t("Location detected! Please select your region manually."),
                });
              }
            }
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error("Error getting location details:", error);
            }
            toast({
              title: t("Could not get location details"),
              variant: "destructive",
            });
          } finally {
            setLoadingLocation(false);
          }
        },
        (error) => {
          if (import.meta.env.DEV) {
            console.error("Error getting location:", error);
          }
          toast({
            title: t("Could not access your location"),
            variant: "destructive",
          });
          setLoadingLocation(false);
        },
        {
          enableHighAccuracy: true, // Use GPS if available
          maximumAge: 0, // Don't use cached position
          timeout: 10000 // 10 second timeout
        }
      );
    } else {
      toast({
        title: t("Geolocation is not supported by your browser"),
        variant: "destructive",
      });
      setLoadingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone local number is required
    if (!phoneLocalNumber || phoneLocalNumber.trim() === "") {
      toast({
        title: t("Phone Required"),
        description: t("Please enter your phone number to continue"),
        variant: "destructive",
      });
      return;
    }

    // Validate phone format: must be 9 digits starting with 9, or 10 digits starting with 0
    const cleanedNumber = phoneLocalNumber.trim().replace(/\s+/g, "");
    
    // Check if it's 9 digits starting with 9, or 10 digits starting with 0
    const isValidFormat = /^9\d{8}$/.test(cleanedNumber) || /^0\d{9}$/.test(cleanedNumber);
    
    if (!isValidFormat) {
      toast({
        title: t("Invalid Phone Number"),
        description: t("Phone number must be 9 digits starting with 9 (e.g., 964594375) or 10 digits starting with 0 (e.g., 0964594375)"),
        variant: "destructive",
      });
      return;
    }

    // Format phone number: 0 + country code + local number
    // If starts with 0, remove it first, then add 0 + country code + number
    // Example: 0964594375 -> remove 0 -> 964594375 -> add 0 + 963 -> 0963964594375
    // Example: 964594375 -> add 0 + 963 -> 0963964594375
    const localNumber = cleanedNumber.startsWith("0") ? cleanedNumber.substring(1) : cleanedNumber;
    const formattedPhone = `0${phoneCountryCode}${localNumber}`;
    
    try {
      setLoading(true);

      const updateData: any = {
        full_name: fullName,
        email: email,
        phone: formattedPhone,
        address: address,
        region_id: regionId || null,
      };

      // Log for debugging
      if (import.meta.env.DEV) {
        console.log("Updating profile with:", {
          regionId,
          regionIdType: typeof regionId,
        });
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user?.id);

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Profile update error:", error);
        }
        throw error;
      }

      if (isFirstTimeUser) {
        toast({
          title: t("Profile Completed! 🎉"),
          description: t("You can now start shopping"),
        });
        setIsFirstTimeUser(false);
        navigate("/");
      } else {
        toast({
          title: t("Profile Updated! ✨"),
          description: t("Your information has been saved successfully"),
        });
      }
    } catch (error: any) {
      toast({
        title: t("Update Failed"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-red-500 to-primary bg-clip-text text-transparent">
              {isFirstTimeUser ? t("Complete Your Profile") : t("My Profile")}
            </h1>
            <p className="text-muted-foreground">
              {isFirstTimeUser ? t("Please complete your profile to start shopping") : t("Manage your personal information")}
            </p>
          </div>

          {/* Avatar Section */}
          <Card className="mb-6 animate-fade-in border-2">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <Avatar key={avatarKey} className="h-32 w-32 border-4 border-primary/20 transition-all duration-300 group-hover:border-primary/40">
                    <AvatarImage 
                      src={getOptimizedImageUrl(avatarUrl, {
                        width: 200,
                        quality: 90,
                        format: 'webp'
                      })} 
                      alt={fullName}
                      loading="eager"
                      decoding="async"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    {!avatarUrl && (
                      <AvatarFallback className="text-3xl bg-gradient-to-r from-primary to-red-500 text-white">
                        {fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:scale-110 transition-transform duration-300 shadow-lg"
                  >
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold">{fullName || t("User")}</h2>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information Form */}
          <Card className="animate-fade-in border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t("Personal Information")}
              </CardTitle>
              <CardDescription>
                {t("Update your personal details and contact information")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {t("Full Name")}
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t("Enter your full name")}
                      className="rounded-xl"
                    />
                  </div>

                  {/* Email - Read Only */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {t("Email")}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      placeholder="your.email@example.com"
                      className="rounded-xl bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">{t("Email cannot be changed")}</p>
                  </div>

                  {/* Phone - Required */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {t("Phone Number")} <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      {/* Country Code Select */}
                      <Select value={phoneCountryCode} onValueChange={setPhoneCountryCode}>
                        <SelectTrigger className="w-[140px] rounded-xl">
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <img 
                                src={countryCodes.find(c => c.code === phoneCountryCode)?.flag || countryCodes[0].flag} 
                                alt={countryCodes.find(c => c.code === phoneCountryCode)?.name || "Syria"}
                                className="h-4 w-5 object-cover rounded-sm"
                              />
                              <span>+{phoneCountryCode}</span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {countryCodes.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              <div className="flex items-center gap-2">
                                <img 
                                  src={country.flag} 
                                  alt={country.name}
                                  className="h-4 w-5 object-cover rounded-sm"
                                />
                                <span>+{country.code} {country.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Local Phone Number Input */}
                      <Input
                        id="phone"
                        type="tel"
                        value={phoneLocalNumber}
                        onChange={(e) => {
                          // Only allow digits
                          const value = e.target.value.replace(/\D/g, "");
                          // Limit to 10 digits max (to allow 0 at start + 9 digits)
                          if (value.length <= 10) {
                            setPhoneLocalNumber(value);
                          }
                        }}
                        placeholder="9********"
                        className="rounded-xl flex-1"
                        required
                        maxLength={10}
                      />
                    </div>
                    {isFirstTimeUser && (
                      <p className="text-xs text-orange-500">{t("Phone number is required to place orders")}</p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {t("Address")}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="address"
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={t("Your address")}
                        className="rounded-xl flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGetLocation}
                        disabled={loadingLocation}
                        className="rounded-xl"
                      >
                        {loadingLocation ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Navigation className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Region */}
                  <div className="space-y-2">
                    <Label htmlFor="region" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {t("Region")}
                    </Label>
<Select 
  value={regionId} 
  onValueChange={(value) => {
    if (import.meta.env.DEV) {
      console.log("Region changed - raw value:", value);
    }
    regionTouchedRef.current = true;
    setRegionId(value);
  }}
>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder={t("Select your region")} />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.id} value={region.id}>
                            {t(region.name)} {region.country && `(${t(region.country)})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Submit Button */}
                <div className="flex justify-end gap-3">
                  {!isFirstTimeUser && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/")}
                      className="rounded-full px-6"
                    >
                      {t("Cancel")}
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={loading || !phoneLocalNumber}
                    className="rounded-full px-8 bg-gradient-to-r from-primary via-red-500 to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] transition-all duration-500 shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("Saving...")}
                      </>
                    ) : isFirstTimeUser ? (
                      t("Complete & Start Shopping")
                    ) : (
                      t("Save Changes")
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
