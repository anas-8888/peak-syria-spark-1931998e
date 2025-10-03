import { MessageCircle, Facebook, Instagram, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground border-t border-primary/20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-4">
              <span className="text-primary">PEAssK</span> Syria
            </h3>
            <p className="text-secondary-foreground/70 mb-4">
              Official distributor of PEAK sportswear in Syria. Premium quality, authentic products.
            </p>
            <div className="flex gap-3">
              <a href="#" className="hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold text-lg mb-4">Categories</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/products?category=basketball" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                  Basketball
                </Link>
              </li>
              <li>
                <Link to="/products?category=running" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                  Running
                </Link>
              </li>
              <li>
                <Link to="/products?category=apparel" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                  Apparel
                </Link>
              </li>
              <li>
                <Link to="/products?category=accessories" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                  Accessories
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-secondary-foreground/70">
                <Phone className="h-4 w-4 text-primary" />
                <span>+963 XXX XXX XXX</span>
              </li>
              <li className="flex items-center gap-2 text-secondary-foreground/70">
                <Mail className="h-4 w-4 text-primary" />
                <span>info@peaksyria.com</span>
              </li>
              <li className="flex items-center gap-2 text-secondary-foreground/70">
                <MessageCircle className="h-4 w-4 text-primary" />
                <a href="https://wa.me/963XXXXXXXXX" className="hover:text-primary transition-colors">
                  WhatsApp Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary/20 mt-8 pt-8 text-center text-secondary-foreground/60 text-sm">
          <p>&copy; {new Date().getFullYear()} PEAK Syria. All rights reserved. Powered by passion for sports.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
