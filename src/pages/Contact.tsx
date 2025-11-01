import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Phone, Mail, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("contact_messages")
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          message: formData.message
        });

      if (error) throw error;

      toast.success("✅ Your message has been sent.", {
        description: "We'll get back to you as soon as possible!"
      });
      
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      console.error("Error submitting message:", error);
      toast.error("Failed to send message", {
        description: "Please try again later."
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-secondary via-secondary/90 to-secondary/80 py-16 sm:py-20 text-secondary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">Contact Us</h1>
          <p className="text-base sm:text-lg md:text-xl text-secondary-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Have questions? We're here to help you find your perfect sportswear
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          {/* Contact Form */}
          <div className="bg-card p-6 sm:p-8 rounded-lg shadow-sm">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold mb-2">
                  Name <span className="text-destructive">*</span>
                </label>
                <Input 
                  id="name" 
                  placeholder="Your full name" 
                  className="w-full"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2">
                  Email <span className="text-destructive">*</span>
                </label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your.email@example.com" 
                  className="w-full"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold mb-2">
                  Phone Number
                </label>
                <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="+963 XXX XXX XXX" 
                  className="w-full"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold mb-2">
                  Message <span className="text-destructive">*</span>
                </label>
                <Textarea 
                  id="message" 
                  placeholder="How can we help you?" 
                  rows={5} 
                  className="w-full"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>

              <Button 
                type="submit"
                variant="hero" 
                size="lg" 
                className="w-full"
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6 sm:space-y-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Get in Touch</h2>
              <p className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6">
                Reach out to us through any of the following channels. Our team is ready to assist you with product
                inquiries, orders, or any questions you might have.
              </p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-start gap-3 sm:gap-4 bg-card p-4 sm:p-6 rounded-lg hover:shadow-md transition-shadow">
                <div className="bg-primary/10 p-2 sm:p-3 rounded-full flex-shrink-0">
                  <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-sm sm:text-base">Phone</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">+963 XXX XXX XXX</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Mon-Sat, 9AM-8PM</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4 bg-card p-4 sm:p-6 rounded-lg hover:shadow-md transition-shadow">
                <div className="bg-primary/10 p-2 sm:p-3 rounded-full flex-shrink-0">
                  <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-sm sm:text-base">WhatsApp</h3>
                  <a
                    href="https://wa.me/963XXXXXXXXX"
                    className="text-primary hover:text-primary/80 transition-colors text-sm sm:text-base"
                  >
                    Chat with us on WhatsApp
                  </a>
                  <p className="text-xs sm:text-sm text-muted-foreground">Quick responses guaranteed</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4 bg-card p-4 sm:p-6 rounded-lg hover:shadow-md transition-shadow">
                <div className="bg-primary/10 p-2 sm:p-3 rounded-full flex-shrink-0">
                  <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-sm sm:text-base">Email</h3>
                  <a
                    href="mailto:info@peaksyria.com"
                    className="text-primary hover:text-primary/80 transition-colors text-sm sm:text-base"
                  >
                    info@peaksyria.com
                  </a>
                  <p className="text-xs sm:text-sm text-muted-foreground">We'll reply within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4 bg-card p-4 sm:p-6 rounded-lg hover:shadow-md transition-shadow">
                <div className="bg-primary/10 p-2 sm:p-3 rounded-full flex-shrink-0">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-sm sm:text-base">Location</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">Damascus, Syria</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Visit us at our showroom</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
