import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Phone, Mail, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ContactSchema, type ContactFormData } from "@/lib/validationSchemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const Contact = () => {
  const form = useForm<ContactFormData>({
    resolver: zodResolver(ContactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: ""
    }
  });

  const { data: storeSettings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .insert({
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          message: data.message
        });

      if (error) throw error;

      toast.success("✅ Your message has been sent.", {
        description: "We'll get back to you as soon as possible!"
      });
      
      form.reset();
    } catch (error) {
      toast.error("Failed to send message", {
        description: "Please try again later."
      });
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+963 XXX XXX XXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Textarea placeholder="How can we help you?" rows={5} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit"
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </Form>
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
              {storeSettings?.store_phone && (
                <div className="flex items-start gap-3 sm:gap-4 bg-card p-4 sm:p-6 rounded-lg hover:shadow-md transition-shadow">
                  <div className="bg-primary/10 p-2 sm:p-3 rounded-full flex-shrink-0">
                    <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">Phone</h3>
                    <a
                      href={`tel:${storeSettings.store_phone}`}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm sm:text-base"
                    >
                      {storeSettings.store_phone}
                    </a>
                    {storeSettings.business_hours && (
                      <p className="text-xs sm:text-sm text-muted-foreground">{storeSettings.business_hours}</p>
                    )}
                  </div>
                </div>
              )}

              {storeSettings?.whatsapp_number && (
                <div className="flex items-start gap-3 sm:gap-4 bg-card p-4 sm:p-6 rounded-lg hover:shadow-md transition-shadow">
                  <div className="bg-primary/10 p-2 sm:p-3 rounded-full flex-shrink-0">
                    <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">WhatsApp</h3>
                    <a
                      href={`https://wa.me/${storeSettings.whatsapp_number.replace(/\D/g, '')}`}
                      className="text-primary hover:text-primary/80 transition-colors text-sm sm:text-base"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Chat with us on WhatsApp
                    </a>
                  </div>
                </div>
              )}

              {storeSettings?.store_email && (
                <div className="flex items-start gap-3 sm:gap-4 bg-card p-4 sm:p-6 rounded-lg hover:shadow-md transition-shadow">
                  <div className="bg-primary/10 p-2 sm:p-3 rounded-full flex-shrink-0">
                    <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">Email</h3>
                    <a
                      href={`mailto:${storeSettings.store_email}`}
                      className="text-primary hover:text-primary/80 transition-colors text-sm sm:text-base"
                    >
                      {storeSettings.store_email}
                    </a>
                    {storeSettings.email_response_time && (
                      <p className="text-xs sm:text-sm text-muted-foreground">{storeSettings.email_response_time}</p>
                    )}
                  </div>
                </div>
              )}

              {storeSettings?.physical_address && (
                <div className="flex items-start gap-3 sm:gap-4 bg-card p-4 sm:p-6 rounded-lg hover:shadow-md transition-shadow">
                  <div className="bg-primary/10 p-2 sm:p-3 rounded-full flex-shrink-0">
                    <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">Location</h3>
                    <p className="text-muted-foreground text-sm sm:text-base">{storeSettings.physical_address}</p>
                    {storeSettings.location_description && (
                      <p className="text-xs sm:text-sm text-muted-foreground">{storeSettings.location_description}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
