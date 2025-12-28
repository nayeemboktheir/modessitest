import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Section {
  id: string;
  type: string;
  order: number;
  settings: Record<string, unknown>;
}

interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: string;
  buttonStyle: string;
}

const DEFAULT_THEME: ThemeSettings = {
  primaryColor: "#000000",
  secondaryColor: "#f5f5f5",
  accentColor: "#ef4444",
  backgroundColor: "#ffffff",
  textColor: "#1f2937",
  fontFamily: "Inter",
  borderRadius: "8px",
  buttonStyle: "filled",
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
        <p className="text-muted-foreground">This landing page does not exist or is not published.</p>
        <Button asChild>
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  const sections = (page.sections as unknown as Section[]) || [];
  const theme = (page.theme_settings as unknown as ThemeSettings) || DEFAULT_THEME;

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: theme.fontFamily,
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      {/* SEO Meta */}
      {page.meta_title && <title>{page.meta_title}</title>}

      {/* Custom CSS */}
      {page.custom_css && <style>{page.custom_css}</style>}

      {/* Render Sections */}
      {sections.length === 0 ? (
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">
          <p>This page has no content yet.</p>
        </div>
      ) : (
        sections.map((section) => (
          <SectionRenderer key={section.id} section={section} theme={theme} slug={slug || ""} />
        ))
      )}
    </div>
  );
};

interface SectionRendererProps {
  section: Section;
  theme: ThemeSettings;
  slug: string;
}

const SectionRenderer = ({ section, theme, slug }: SectionRendererProps) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [orderForm, setOrderForm] = useState({
    name: "",
    phone: "",
    address: "",
    district: "",
    quantity: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Countdown effect
  useEffect(() => {
    if (section.type !== "countdown") return;
    const settings = section.settings as { endDate: string };
    if (!settings.endDate) return;

    const timer = setInterval(() => {
      const end = new Date(settings.endDate).getTime();
      const now = Date.now();
      const diff = Math.max(0, end - now);

      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [section]);

  const handleOrderSubmit = async (e: React.FormEvent, settings: Record<string, unknown>) => {
    e.preventDefault();
    if (!orderForm.name || !orderForm.phone || !orderForm.address) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate order number
      const orderNumber = `LP-${Date.now().toString(36).toUpperCase()}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          shipping_name: orderForm.name,
          shipping_phone: orderForm.phone,
          shipping_street: orderForm.address,
          shipping_district: orderForm.district || "N/A",
          shipping_city: "Bangladesh",
          subtotal: 0,
          total: 0,
          order_source: `landing-page:${slug}`,
          status: "pending",
          payment_method: "cod",
          payment_status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      toast.success("Order placed successfully! We will contact you shortly.");
      setOrderForm({ name: "", phone: "", address: "", district: "", quantity: 1 });
    } catch (error) {
      console.error("Order error:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  switch (section.type) {
    case "hero-product": {
      const settings = section.settings as {
        images: string[];
        title: string;
        subtitle: string;
        price: string;
        originalPrice: string;
        buttonText: string;
        buttonLink: string;
        badges: Array<{ text: string; subtext: string }>;
        backgroundColor: string;
        textColor: string;
        layout: string;
      };

      const images = settings.images || [];
      const isCenter = settings.layout === "center";
      const isRightImage = settings.layout === "right-image";

      const imageSection = (
        <div className="relative">
          {images.length > 0 ? (
            <div className="relative aspect-[3/4] max-w-md mx-auto">
              <img
                src={images[currentImage]}
                alt={settings.title}
                className="w-full h-full object-cover rounded-lg"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage((p) => (p - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImage((p) => (p + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImage(idx)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === currentImage ? "bg-white" : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
      );

      const textSection = (
        <div className={`space-y-6 ${isCenter ? "text-center" : ""}`}>
          <h1 className="text-3xl md:text-5xl font-bold" style={{ color: settings.textColor }}>
            {settings.title}
          </h1>
          {settings.subtitle && (
            <p className="text-lg opacity-80" style={{ color: settings.textColor }}>
              {settings.subtitle}
            </p>
          )}
          <div
            className="flex items-baseline gap-3"
            style={{ justifyContent: isCenter ? "center" : "flex-start" }}
          >
            <span className="text-xl" style={{ color: theme.accentColor }}>
              দাম
            </span>
            <span className="text-4xl font-bold" style={{ color: theme.accentColor }}>
              {settings.price ? `${settings.price}৳` : ""}
            </span>
            {settings.originalPrice && (
              <span
                className="text-lg line-through opacity-50"
                style={{ color: settings.textColor }}
              >
                {settings.originalPrice}৳
              </span>
            )}
          </div>
          {settings.buttonText && (
            <Button
              size="lg"
              className="px-10 py-6 text-lg"
              style={{
                backgroundColor: theme.primaryColor,
                color: "#fff",
                borderRadius: theme.borderRadius,
              }}
              onClick={() => {
                const target = document.getElementById("checkout");
                if (target) target.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {settings.buttonText}
            </Button>
          )}

          {settings.badges?.length > 0 && (
            <div
              className="flex flex-wrap gap-6 mt-8"
              style={{ justifyContent: isCenter ? "center" : "flex-start" }}
            >
              {settings.badges.map((badge, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-2xl font-bold" style={{ color: settings.textColor }}>
                    {badge.text}
                  </div>
                  <div className="text-sm opacity-70" style={{ color: settings.textColor }}>
                    {badge.subtext}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );

      return (
        <section className="py-12 md:py-20 px-4" style={{ backgroundColor: settings.backgroundColor }}>
          {isCenter ? (
            <div className="max-w-4xl mx-auto space-y-8">
              {imageSection}
              {textSection}
            </div>
          ) : (
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
              {isRightImage ? (
                <>
                  {textSection}
                  {imageSection}
                </>
              ) : (
                <>
                  {imageSection}
                  {textSection}
                </>
              )}
            </div>
          )}
        </section>
      );
    }

    case "feature-badges": {
      const settings = section.settings as {
        title: string;
        badges: Array<{ icon: string; title: string; description: string }>;
        columns: number;
        backgroundColor: string;
        textColor: string;
      };

      return (
        <section
          className="py-12 px-4"
          style={{ backgroundColor: settings.backgroundColor, color: settings.textColor }}
        >
          <div className="max-w-6xl mx-auto">
            {settings.title && (
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{settings.title}</h2>
            )}
            <div
              className="grid gap-6"
              style={{ gridTemplateColumns: `repeat(${settings.columns || 3}, 1fr)` }}
            >
              {(settings.badges || []).map((badge, idx) => (
                <div key={idx} className="text-center p-4">
                  <div className="text-xl font-bold mb-1">👉{badge.title}</div>
                  <div className="text-sm opacity-80">{badge.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "text-block": {
      const settings = section.settings as {
        content: string;
        alignment: string;
        fontSize: string;
        backgroundColor: string;
        textColor: string;
        padding: string;
      };

      return (
        <section
          className="px-4"
          style={{
            backgroundColor: settings.backgroundColor || "transparent",
            color: settings.textColor,
            padding: settings.padding,
            textAlign: settings.alignment as "left" | "center" | "right",
            fontSize: settings.fontSize,
          }}
        >
          <div className="max-w-4xl mx-auto whitespace-pre-wrap">{settings.content}</div>
        </section>
      );
    }

    case "checkout-form": {
      const settings = section.settings as {
        title: string;
        buttonText: string;
        backgroundColor: string;
        accentColor: string;
      };

      return (
        <section
          id="checkout"
          className="py-12 px-4"
          style={{ backgroundColor: settings.backgroundColor }}
        >
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">{settings.title}</h2>
            <form onSubmit={(e) => handleOrderSubmit(e, settings)} className="space-y-4">
              <div>
                <Input
                  value={orderForm.name}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="আপনার নাম *"
                  required
                  className="h-12 text-lg"
                />
              </div>
              <div>
                <Input
                  value={orderForm.phone}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="মোবাইল নম্বর *"
                  type="tel"
                  required
                  className="h-12 text-lg"
                />
              </div>
              <div>
                <Textarea
                  value={orderForm.address}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="সম্পূর্ণ ঠিকানা *"
                  required
                  rows={3}
                  className="text-lg"
                />
              </div>
              <div>
                <Select
                  value={orderForm.district}
                  onValueChange={(v) => setOrderForm((prev) => ({ ...prev, district: v }))}
                >
                  <SelectTrigger className="h-12 text-lg">
                    <SelectValue placeholder="জেলা নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dhaka">ঢাকা (Inside Dhaka)</SelectItem>
                    <SelectItem value="outside">ঢাকার বাইরে (Outside Dhaka)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold"
                style={{
                  backgroundColor: settings.accentColor || theme.accentColor,
                  color: "#fff",
                  borderRadius: theme.borderRadius,
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : settings.buttonText}
              </Button>
            </form>
          </div>
        </section>
      );
    }

    case "cta-banner": {
      const settings = section.settings as {
        title: string;
        subtitle: string;
        buttonText: string;
        buttonLink: string;
        backgroundColor: string;
        textColor: string;
      };

      return (
        <section
          className="py-16 px-4 text-center"
          style={{ backgroundColor: settings.backgroundColor, color: settings.textColor }}
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">{settings.title}</h2>
            {settings.subtitle && <p className="text-lg mb-6 opacity-90">{settings.subtitle}</p>}
            {settings.buttonText && (
              <Button
                size="lg"
                variant="secondary"
                style={{ borderRadius: theme.borderRadius }}
                onClick={() => {
                  if (settings.buttonLink?.startsWith("#")) {
                    const target = document.getElementById(settings.buttonLink.slice(1));
                    if (target) target.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                {settings.buttonText}
              </Button>
            )}
          </div>
        </section>
      );
    }

    case "image-gallery": {
      const settings = section.settings as {
        images: string[];
        columns: number;
        gap: string;
        aspectRatio: string;
      };

      const aspectClass: Record<string, string> = {
        square: "aspect-square",
        portrait: "aspect-[3/4]",
        landscape: "aspect-video",
        auto: "",
      };

      return (
        <section className="py-8 px-4">
          <div
            className="max-w-6xl mx-auto grid"
            style={{
              gridTemplateColumns: `repeat(${settings.columns || 3}, 1fr)`,
              gap: settings.gap || "16px",
            }}
          >
            {(settings.images || []).map((img, idx) => (
              <div key={idx} className={aspectClass[settings.aspectRatio] || "aspect-square"}>
                <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "image-text": {
      const settings = section.settings as {
        image: string;
        title: string;
        description: string;
        buttonText: string;
        buttonLink: string;
        imagePosition: string;
        backgroundColor: string;
      };

      const isLeft = settings.imagePosition !== "right";

      return (
        <section className="py-12 px-4" style={{ backgroundColor: settings.backgroundColor }}>
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
            {isLeft && (
              <div className="aspect-video">
                {settings.image ? (
                  <img src={settings.image} alt="" className="w-full h-full object-cover rounded-lg" />
                ) : null}
              </div>
            )}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{settings.title}</h2>
              <p className="opacity-80">{settings.description}</p>
              {settings.buttonText && (
                <Button style={{ borderRadius: theme.borderRadius }}>{settings.buttonText}</Button>
              )}
            </div>
            {!isLeft && (
              <div className="aspect-video">
                {settings.image ? (
                  <img src={settings.image} alt="" className="w-full h-full object-cover rounded-lg" />
                ) : null}
              </div>
            )}
          </div>
        </section>
      );
    }

    case "testimonials": {
      const settings = section.settings as {
        title: string;
        items: Array<{ name: string; role: string; content: string; avatar: string }>;
        layout: string;
        columns: number;
      };

      return (
        <section className="py-12 px-4" style={{ backgroundColor: theme.secondaryColor }}>
          <div className="max-w-6xl mx-auto">
            {settings.title && (
              <h2 className="text-2xl font-bold text-center mb-8">{settings.title}</h2>
            )}
            <div
              className="grid gap-6"
              style={{ gridTemplateColumns: `repeat(${settings.columns || 3}, 1fr)` }}
            >
              {(settings.items || []).map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-lg shadow-sm">
                  <p className="mb-4 text-muted-foreground">&ldquo;{item.content}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    {item.avatar ? (
                      <img src={item.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.primaryColor + "20" }}
                      >
                        <span className="font-medium">{item.name?.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{item.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "faq": {
      const settings = section.settings as {
        title: string;
        items: Array<{ question: string; answer: string }>;
        backgroundColor: string;
      };

      return (
        <section className="py-12 px-4" style={{ backgroundColor: settings.backgroundColor }}>
          <div className="max-w-3xl mx-auto">
            {settings.title && (
              <h2 className="text-2xl font-bold text-center mb-8">{settings.title}</h2>
            )}
            <Accordion type="single" collapsible className="w-full">
              {(settings.items || []).map((item, idx) => (
                <AccordionItem key={idx} value={`faq-${idx}`}>
                  <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      );
    }

    case "video": {
      const settings = section.settings as {
        videoUrl: string;
        autoplay: boolean;
        controls: boolean;
        loop: boolean;
      };

      if (!settings.videoUrl) return null;

      const isEmbed =
        settings.videoUrl.includes("youtube.com/embed") || settings.videoUrl.includes("vimeo.com");

      return (
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto aspect-video">
            {isEmbed ? (
              <iframe
                src={settings.videoUrl}
                className="w-full h-full rounded-lg"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            ) : (
              <video
                src={settings.videoUrl}
                className="w-full h-full rounded-lg"
                autoPlay={settings.autoplay}
                controls={settings.controls}
                loop={settings.loop}
              />
            )}
          </div>
        </section>
      );
    }

    case "countdown": {
      const settings = section.settings as {
        title: string;
        endDate: string;
        backgroundColor: string;
        textColor: string;
      };

      return (
        <section
          className="py-8 px-4 text-center"
          style={{ backgroundColor: settings.backgroundColor, color: settings.textColor }}
        >
          <div className="max-w-4xl mx-auto">
            {settings.title && <h2 className="text-xl font-bold mb-4">{settings.title}</h2>}
            <div className="flex justify-center gap-4 md:gap-8">
              {[
                { label: "Days", value: countdown.days },
                { label: "Hours", value: countdown.hours },
                { label: "Minutes", value: countdown.minutes },
                { label: "Seconds", value: countdown.seconds },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-3xl md:text-5xl font-bold">
                    {String(item.value).padStart(2, "0")}
                  </div>
                  <div className="text-sm opacity-80">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "divider": {
      const settings = section.settings as {
        style: string;
        color: string;
        thickness: string;
        width: string;
      };

      return (
        <div className="px-4">
          <hr
            style={{
              borderStyle: settings.style as "solid" | "dashed" | "dotted",
              borderColor: settings.color,
              borderWidth: `${settings.thickness} 0 0 0`,
              width: settings.width,
              margin: "0 auto",
            }}
          />
        </div>
      );
    }

    case "spacer": {
      const settings = section.settings as { height: string };
      return <div style={{ height: settings.height }} />;
    }

    default:
      return null;
  }
};

export default LandingPage;
