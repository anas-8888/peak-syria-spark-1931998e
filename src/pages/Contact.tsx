import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Phone, Mail, MapPin } from "lucide-react";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-secondary py-20 text-secondary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
          <p className="text-lg text-secondary-foreground/70 max-w-2xl mx-auto">
            Have questions? We're here to help you find your perfect sportswear
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-card p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold mb-2">
                  Name
                </label>
                <Input id="name" placeholder="Your full name" />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2">
                  Email
                </label>
                <Input id="email" type="email" placeholder="your.email@example.com" />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold mb-2">
                  Phone Number
                </label>
                <Input id="phone" type="tel" placeholder="+963 XXX XXX XXX" />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold mb-2">
                  Message
                </label>
                <Textarea id="message" placeholder="How can we help you?" rows={5} />
              </div>

              <Button variant="hero" size="lg" className="w-full">
                Send Message
              </Button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
              <p className="text-muted-foreground mb-6">
                Reach out to us through any of the following channels. Our team is ready to assist you with product
                inquiries, orders, or any questions you might have.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4 bg-card p-4 rounded-lg">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Phone</h3>
                  <p className="text-muted-foreground">+963 XXX XXX XXX</p>
                  <p className="text-sm text-muted-foreground">Mon-Sat, 9AM-8PM</p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-card p-4 rounded-lg">
                <div className="bg-primary/10 p-3 rounded-full">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">WhatsApp</h3>
                  <a
                    href="https://wa.me/963XXXXXXXXX"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    Chat with us on WhatsApp
                  </a>
                  <p className="text-sm text-muted-foreground">Quick responses guaranteed</p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-card p-4 rounded-lg">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <a
                    href="mailto:info@peaksyria.com"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    info@peaksyria.com
                  </a>
                  <p className="text-sm text-muted-foreground">We'll reply within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-card p-4 rounded-lg">
                <div className="bg-primary/10 p-3 rounded-full">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Location</h3>
                  <p className="text-muted-foreground">Damascus, Syria</p>
                  <p className="text-sm text-muted-foreground">Visit us at our showroom</p>
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
