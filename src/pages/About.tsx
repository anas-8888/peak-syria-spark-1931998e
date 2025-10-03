import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Award, Users, TrendingUp } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-secondary py-20 text-secondary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About PEAK Syria</h1>
          <p className="text-lg text-secondary-foreground/70 max-w-3xl mx-auto">
            The official and exclusive distributor of PEAK sportswear in Syria
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">Our Story</h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              PEAK Syria is proud to be the official distributor of PEAK Sport Products in Syria. Founded with a
              passion for sports and a commitment to excellence, we bring world-class athletic footwear and apparel
              to Syrian athletes and sports enthusiasts.
            </p>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              PEAK is a leading international sports brand with a strong presence in over 100 countries. Known for
              its innovative designs, cutting-edge technology, and premium quality, PEAK has become the choice of
              professional athletes worldwide.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We are committed to providing authentic PEAK products, exceptional customer service, and promoting an
              active lifestyle throughout Syria. Whether you're a professional athlete or just starting your fitness
              journey, PEAK Syria is here to support your goals.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-card p-6 rounded-lg shadow-sm text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">100% Authentic</h3>
              <p className="text-muted-foreground">
                Official distributor ensuring genuine PEAK products
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Premium Quality</h3>
              <p className="text-muted-foreground">
                World-class materials and craftsmanship
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Expert Support</h3>
              <p className="text-muted-foreground">
                Dedicated team to help you find the perfect fit
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Latest Collections</h3>
              <p className="text-muted-foreground">
                First access to new releases and innovations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-secondary-foreground/80 leading-relaxed">
              To empower athletes and sports enthusiasts across Syria with premium, authentic PEAK sportswear,
              fostering a culture of excellence, performance, and healthy living. We strive to make world-class
              athletic gear accessible to everyone, from professional athletes to weekend warriors.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
