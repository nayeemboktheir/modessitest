import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Star, Heart, Shield, Truck, Award, Zap } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  avatar: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  images: string[] | null;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Star,
  Heart,
  Shield,
  Truck,
  Award,
  Zap,
};

const LandingPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading, error } = useQuery({
    queryKey: ["landing-page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["landing-products", page?.product_ids],
    queryFn: async () => {
      if (!page?.product_ids?.length) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, original_price, images")
        .in("id", page.product_ids)
        .eq("is_active", true);

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!page?.product_ids?.length,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Page Not Found</h1>
        <p className="text-muted-foreground">This landing page doesn't exist or is not published.</p>
        <Button asChild>
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  const features = (page.features as unknown as Feature[]) || [];
  const testimonials = (page.testimonials as unknown as Testimonial[]) || [];
  const faqs = (page.faqs as unknown as FAQ[]) || [];

  const getButtonVariant = (style: string) => {
    switch (style) {
      case "secondary":
        return "secondary";
      case "outline":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Custom CSS */}
      {page.custom_css && <style>{page.custom_css}</style>}

      <main className="flex-1">
        {/* Hero Section */}
        {page.hero_title && (
          <section
            className="relative py-20 md:py-32"
            style={{
              backgroundImage: page.hero_image ? `url(${page.hero_image})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {page.hero_image && (
              <div className="absolute inset-0 bg-black/50" />
            )}
            <div className="container relative z-10 text-center">
              <h1 className={`text-4xl md:text-6xl font-bold mb-6 ${page.hero_image ? 'text-white' : ''}`}>
                {page.hero_title}
              </h1>
              {page.hero_subtitle && (
                <p className={`text-xl md:text-2xl mb-8 max-w-2xl mx-auto ${page.hero_image ? 'text-white/90' : 'text-muted-foreground'}`}>
                  {page.hero_subtitle}
                </p>
              )}
              {page.hero_button_text && (
                <Button
                  size="lg"
                  variant={getButtonVariant(page.hero_button_style || "default")}
                  asChild
                >
                  <Link to={page.hero_button_link || "#"}>{page.hero_button_text}</Link>
                </Button>
              )}
            </div>
          </section>
        )}

        {/* Features Section */}
        {page.features_enabled && features.length > 0 && (
          <section className="py-16 bg-muted/30">
            <div className="container">
              {page.features_title && (
                <h2 className="text-3xl font-bold text-center mb-12">{page.features_title}</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature) => {
                  const IconComponent = iconMap[feature.icon] || Star;
                  return (
                    <Card key={feature.id} className="text-center">
                      <CardContent className="pt-6">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Products Section */}
        {page.products_enabled && products && products.length > 0 && (
          <section className="py-16">
            <div className="container">
              {page.products_title && (
                <h2 className="text-3xl font-bold text-center mb-12">{page.products_title}</h2>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Link key={product.id} to={`/products/${product.slug}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-square relative">
                        <img
                          src={product.images?.[0] || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        {product.original_price && product.original_price > product.price && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                            {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium line-clamp-2 mb-2">{product.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">৳{product.price}</span>
                          {product.original_price && product.original_price > product.price && (
                            <span className="text-sm text-muted-foreground line-through">
                              ৳{product.original_price}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        {page.cta_enabled && page.cta_title && (
          <section
            className="py-16 text-white"
            style={{ backgroundColor: page.cta_background_color || "#000" }}
          >
            <div className="container text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{page.cta_title}</h2>
              {page.cta_subtitle && (
                <p className="text-xl mb-8 opacity-90">{page.cta_subtitle}</p>
              )}
              {page.cta_button_text && (
                <Button size="lg" variant="secondary" asChild>
                  <Link to={page.cta_button_link || "#"}>{page.cta_button_text}</Link>
                </Button>
              )}
            </div>
          </section>
        )}

        {/* Testimonials Section */}
        {page.testimonials_enabled && testimonials.length > 0 && (
          <section className="py-16 bg-muted/30">
            <div className="container">
              {page.testimonials_title && (
                <h2 className="text-3xl font-bold text-center mb-12">{page.testimonials_title}</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {testimonials.map((testimonial) => (
                  <Card key={testimonial.id}>
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                      <div className="flex items-center gap-3">
                        {testimonial.avatar ? (
                          <img
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-semibold">
                              {testimonial.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{testimonial.name}</p>
                          {testimonial.role && (
                            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {page.faq_enabled && faqs.length > 0 && (
          <section className="py-16">
            <div className="container max-w-3xl">
              {page.faq_title && (
                <h2 className="text-3xl font-bold text-center mb-12">{page.faq_title}</h2>
              )}
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
