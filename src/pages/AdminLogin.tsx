import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { toast } from "sonner";
import { Loader2, Shield } from "lucide-react";
import peakLogo from "@/assets/peak-logo.png";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !adminLoading) {
      if (isAdmin) {
        navigate("/dashboard");
      } else {
        toast.error("Access Denied", {
          description: "You don't have admin privileges",
        });
        navigate("/");
      }
    }
  }, [user, isAdmin, adminLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error("Login Failed", {
        description: error.message,
        duration: 4000,
      });
      setLoading(false);
    } else {
      toast.success("Welcome Admin! 🔐", {
        description: "Redirecting to dashboard...",
        duration: 2000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-card p-8 rounded-lg shadow-lg border-2 border-primary/20">
            {/* Logo & Title */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <img src={peakLogo} alt="PEAK Logo" className="h-16 w-auto" />
                  <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-2">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-red-500 to-primary bg-clip-text text-transparent">
                Admin Access
              </h1>
              <p className="text-muted-foreground mt-2">Dashboard Login</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 rounded-xl"
                  placeholder="admin@peaksyria.com"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 rounded-xl"
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full rounded-full bg-gradient-to-r from-primary via-red-500 to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] transition-all duration-500 shadow-lg hover:shadow-xl"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Access Dashboard
                  </>
                )}
              </Button>
            </form>

            {/* Back Link */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link to="/" className="text-primary hover:underline font-semibold">
                ← Back to Home
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminLogin;
