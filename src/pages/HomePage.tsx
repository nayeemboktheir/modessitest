import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Truck, Shield, Headphones, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/products/ProductCard';
import { fetchFeaturedProducts, fetchNewProducts } from '@/services/productService';
import { Product } from '@/types';

// Hero slides data
const heroSlides = [
  {
    id: 1,
    title: 'New Collection 2025',
    subtitle: 'Fashion Special',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=1080&fit=crop',
    link: '/products',
    cta: 'Shop Now',
  },
  {
    id: 2,
    title: 'Three Piece Sets',
    subtitle: 'Complete Look',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&h=1080&fit=crop',
    link: '/products?category=threepcs',
    cta: 'Explore',
  },
  {
    id: 3,
    title: 'Two Piece Collection',
    subtitle: 'Elegant Pairs',
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&h=1080&fit=crop',
    link: '/products?category=twopcs',
    cta: 'View Collection',
  },
];

// Category banners
const categoryBanners = [
  {
    id: 'threepcs',
    name: 'Three Pcs',
    description: 'Complete outfit sets',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop',
    link: '/products?category=threepcs',
    price: 'Starting at ৳2,990',
  },
  {
    id: 'twopcs',
    name: 'Two Pcs',
    description: 'Elegant pairs',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=800&fit=crop',
    link: '/products?category=twopcs',
    price: 'Starting at ৳1,990',
  },
  {
    id: 'onepcs',
    name: 'One Pcs',
    description: 'Single pieces',
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&h=800&fit=crop',
    link: '/products?category=onepcs',
    price: 'Starting at ৳990',
  },
];

const features = [
  { icon: Truck, title: 'Free Shipping', description: 'Orders over ৳2000' },
  { icon: Shield, title: 'Secure Payment', description: '100% protected' },
  { icon: Headphones, title: '24/7 Support', description: 'Always available' },
  { icon: RotateCcw, title: 'Easy Returns', description: '30-day policy' },
];

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [featured, newArrivals] = await Promise.all([
          fetchFeaturedProducts(),
          fetchNewProducts(),
        ]);
        setFeaturedProducts(featured);
        setNewProducts(newArrivals);
      } catch (error) {
        console.error('Failed to load home page data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Auto-slide
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Slider - Full Width */}
      <section className="relative h-[70vh] md:h-[85vh] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${heroSlides[currentSlide].image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
            
            <div className="absolute inset-0 flex items-end pb-20 md:pb-32">
              <div className="container-custom">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="max-w-xl"
                >
                  <span className="inline-block text-primary-foreground/80 text-sm md:text-base font-medium tracking-wider uppercase mb-2">
                    {heroSlides[currentSlide].subtitle}
                  </span>
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-primary-foreground mb-6 leading-tight">
                    {heroSlides[currentSlide].title}
                  </h1>
                  <Button 
                    variant="cta" 
                    size="lg" 
                    asChild 
                    className="text-base px-8"
                  >
                    <Link to={heroSlides[currentSlide].link}>
                      {heroSlides[currentSlide].cta}
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slider Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/20 backdrop-blur-sm text-primary-foreground hover:bg-background/40 transition-colors flex items-center justify-center"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/20 backdrop-blur-sm text-primary-foreground hover:bg-background/40 transition-colors flex items-center justify-center"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'w-8 bg-primary-foreground' 
                  : 'w-4 bg-primary-foreground/40 hover:bg-primary-foreground/60'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Features Bar */}
      <section className="border-b border-border bg-card">
        <div className="container-custom py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Banners - Grid Layout */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
              Shop by Category
            </h2>
            <p className="text-muted-foreground">Find your perfect style</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {categoryBanners.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link 
                  to={category.link}
                  className="group relative block aspect-[3/4] rounded-xl overflow-hidden"
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                  
                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    <span className="text-xs font-medium text-primary-foreground/80 uppercase tracking-wider mb-1">
                      {category.description}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-display font-bold text-primary-foreground mb-2">
                      {category.name}
                    </h3>
                    <p className="text-sm text-primary-foreground/80 mb-4">
                      {category.price}
                    </p>
                    <span className="inline-flex items-center text-sm font-medium text-primary-foreground group-hover:underline">
                      Shop Now
                      <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container-custom">
          <div className="flex items-end justify-between mb-8">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1"
              >
                Featured Products
              </motion.h2>
              <p className="text-muted-foreground text-sm">Handpicked for you</p>
            </div>
            <Button variant="link" asChild className="hidden md:flex">
              <Link to="/products?featured=true">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {featuredProducts.slice(0, 8).map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" asChild>
              <Link to="/products?featured=true">
                View All Products
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920&h=600&fit=crop)' }}
            />
            <div className="absolute inset-0 bg-foreground/70" />
            
            <div className="relative z-10 py-16 md:py-24 px-8 md:px-16 text-center">
              <span className="inline-block px-4 py-1 bg-secondary/20 text-secondary rounded-full text-sm font-medium mb-4">
                Limited Time Offer
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-primary-foreground mb-4">
                Up to 50% Off
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
                Don't miss out on our biggest sale of the season. Shop now and save big!
              </p>
              <Button variant="cta" size="lg" asChild>
                <Link to="/products">
                  Shop Sale
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container-custom">
          <div className="flex items-end justify-between mb-8">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1"
              >
                Just In
              </motion.h2>
              <p className="text-muted-foreground text-sm">Latest arrivals</p>
            </div>
            <Button variant="link" asChild className="hidden md:flex">
              <Link to="/products?new=true">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {newProducts.slice(0, 4).map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Stay Updated
            </h2>
            <p className="text-primary-foreground/80 mb-8">
              Subscribe for exclusive deals and new arrivals
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 h-12 px-4 rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:border-primary-foreground/50 focus:outline-none transition-colors"
              />
              <Button 
                type="submit" 
                className="h-12 px-6 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
