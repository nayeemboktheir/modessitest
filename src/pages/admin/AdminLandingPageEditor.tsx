import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Eye, Plus, Trash2, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { Link } from "react-router-dom";

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

interface LandingPageData {
  id?: string;
  title: string;
  slug: string;
  description: string;
  is_active: boolean;
  is_published: boolean;
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  hero_button_text: string;
  hero_button_link: string;
  hero_button_style: string;
  features_enabled: boolean;
  features_title: string;
  features: Feature[];
  products_enabled: boolean;
  products_title: string;
  product_ids: string[];
  cta_enabled: boolean;
  cta_title: string;
  cta_subtitle: string;
  cta_button_text: string;
  cta_button_link: string;
  cta_background_color: string;
  testimonials_enabled: boolean;
  testimonials_title: string;
  testimonials: Testimonial[];
  faq_enabled: boolean;
  faq_title: string;
  faqs: FAQ[];
  custom_css: string;
  meta_title: string;
  meta_description: string;
}

const defaultData: LandingPageData = {
  title: "",
  slug: "",
  description: "",
  is_active: false,
  is_published: false,
  hero_title: "",
  hero_subtitle: "",
  hero_image: "",
  hero_button_text: "Shop Now",
  hero_button_link: "",
  hero_button_style: "primary",
  features_enabled: false,
  features_title: "Features",
  features: [],
  products_enabled: false,
  products_title: "Featured Products",
  product_ids: [],
  cta_enabled: false,
  cta_title: "",
  cta_subtitle: "",
  cta_button_text: "Get Started",
  cta_button_link: "",
  cta_background_color: "#000000",
  testimonials_enabled: false,
  testimonials_title: "What Our Customers Say",
  testimonials: [],
  faq_enabled: false,
  faq_title: "Frequently Asked Questions",
  faqs: [],
  custom_css: "",
  meta_title: "",
  meta_description: "",
};

const AdminLandingPageEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [formData, setFormData] = useState<LandingPageData>(defaultData);

  // Fetch existing landing page
  const { data: existingPage, isLoading } = useQuery({
    queryKey: ["landing-page", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  // Fetch products for selection
  const { data: products } = useQuery({
    queryKey: ["admin-products-for-landing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, images, price")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (existingPage) {
      setFormData({
        ...defaultData,
        ...existingPage,
        features: (existingPage.features as unknown as Feature[]) || [],
        testimonials: (existingPage.testimonials as unknown as Testimonial[]) || [],
        faqs: (existingPage.faqs as unknown as FAQ[]) || [],
        product_ids: existingPage.product_ids || [],
      });
    }
  }, [existingPage]);

  const saveMutation = useMutation({
    mutationFn: async (data: LandingPageData) => {
      const payload = {
        title: data.title,
        slug: data.slug,
        description: data.description,
        is_active: data.is_active,
        is_published: data.is_published,
        hero_title: data.hero_title,
        hero_subtitle: data.hero_subtitle,
        hero_image: data.hero_image,
        hero_button_text: data.hero_button_text,
        hero_button_link: data.hero_button_link,
        hero_button_style: data.hero_button_style,
        features_enabled: data.features_enabled,
        features_title: data.features_title,
        features: JSON.parse(JSON.stringify(data.features)),
        products_enabled: data.products_enabled,
        products_title: data.products_title,
        product_ids: data.product_ids,
        cta_enabled: data.cta_enabled,
        cta_title: data.cta_title,
        cta_subtitle: data.cta_subtitle,
        cta_button_text: data.cta_button_text,
        cta_button_link: data.cta_button_link,
        cta_background_color: data.cta_background_color,
        testimonials_enabled: data.testimonials_enabled,
        testimonials_title: data.testimonials_title,
        testimonials: JSON.parse(JSON.stringify(data.testimonials)),
        faq_enabled: data.faq_enabled,
        faq_title: data.faq_title,
        faqs: JSON.parse(JSON.stringify(data.faqs)),
        custom_css: data.custom_css,
        meta_title: data.meta_title,
        meta_description: data.meta_description,
      };

      if (isNew) {
        const { data: result, error } = await supabase
          .from("landing_pages")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from("landing_pages")
          .update(payload)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return result;
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-landing-pages"] });
      toast.success(isNew ? "Landing page created!" : "Landing page saved!");
      if (isNew && result?.id) {
        navigate(`/admin/landing-pages/${result.id}`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save landing page");
    },
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const addFeature = () => {
    setFormData((prev) => ({
      ...prev,
      features: [
        ...prev.features,
        { id: crypto.randomUUID(), icon: "Star", title: "", description: "" },
      ],
    }));
  };

  const removeFeature = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((f) => f.id !== id),
    }));
  };

  const updateFeature = (id: string, field: keyof Feature, value: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.map((f) =>
        f.id === id ? { ...f, [field]: value } : f
      ),
    }));
  };

  const addTestimonial = () => {
    setFormData((prev) => ({
      ...prev,
      testimonials: [
        ...prev.testimonials,
        { id: crypto.randomUUID(), name: "", role: "", content: "", avatar: "" },
      ],
    }));
  };

  const removeTestimonial = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      testimonials: prev.testimonials.filter((t) => t.id !== id),
    }));
  };

  const updateTestimonial = (id: string, field: keyof Testimonial, value: string) => {
    setFormData((prev) => ({
      ...prev,
      testimonials: prev.testimonials.map((t) =>
        t.id === id ? { ...t, [field]: value } : t
      ),
    }));
  };

  const addFAQ = () => {
    setFormData((prev) => ({
      ...prev,
      faqs: [
        ...prev.faqs,
        { id: crypto.randomUUID(), question: "", answer: "" },
      ],
    }));
  };

  const removeFAQ = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((f) => f.id !== id),
    }));
  };

  const updateFAQ = (id: string, field: keyof FAQ, value: string) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.map((f) =>
        f.id === id ? { ...f, [field]: value } : f
      ),
    }));
  };

  const toggleProduct = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      product_ids: prev.product_ids.includes(productId)
        ? prev.product_ids.filter((id) => id !== productId)
        : [...prev.product_ids, productId],
    }));
  };

  if (!isNew && isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/landing-pages">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isNew ? "Create Landing Page" : "Edit Landing Page"}
            </h1>
            <p className="text-muted-foreground">
              {isNew ? "Build a new landing page" : `Editing: ${formData.title}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && formData.is_published && (
            <Button variant="outline" asChild>
              <a href={`/lp/${formData.slug}`} target="_blank" rel="noopener noreferrer">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </a>
            </Button>
          )}
          <Button
            onClick={() => saveMutation.mutate(formData)}
            disabled={saveMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic landing page information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        title,
                        slug: prev.slug || generateSlug(title),
                      }));
                    }}
                    placeholder="Summer Sale 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">/lp/</span>
                    <Input
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, slug: e.target.value }))
                      }
                      placeholder="summer-sale-2024"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Internal description for this landing page"
                  rows={3}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Published</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this landing page visible to visitors
                  </p>
                </div>
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_published: checked,
                      is_active: checked,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hero Tab */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>The main banner at the top of the page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Hero Title</Label>
                <Input
                  value={formData.hero_title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, hero_title: e.target.value }))
                  }
                  placeholder="Exclusive Summer Collection"
                />
              </div>

              <div className="space-y-2">
                <Label>Hero Subtitle</Label>
                <Textarea
                  value={formData.hero_subtitle}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, hero_subtitle: e.target.value }))
                  }
                  placeholder="Discover amazing deals on premium products"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Hero Image URL</Label>
                <Input
                  value={formData.hero_image}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, hero_image: e.target.value }))
                  }
                  placeholder="https://example.com/hero-image.jpg"
                />
                {formData.hero_image && (
                  <img
                    src={formData.hero_image}
                    alt="Hero preview"
                    className="mt-2 h-40 w-full object-cover rounded-lg"
                  />
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Button Text</Label>
                  <Input
                    value={formData.hero_button_text}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        hero_button_text: e.target.value,
                      }))
                    }
                    placeholder="Shop Now"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Button Link</Label>
                  <Input
                    value={formData.hero_button_link}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        hero_button_link: e.target.value,
                      }))
                    }
                    placeholder="/products"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Button Style</Label>
                  <Select
                    value={formData.hero_button_style}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, hero_button_style: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Features Section</CardTitle>
                  <CardDescription>Highlight key features or benefits</CardDescription>
                </div>
                <Switch
                  checked={formData.features_enabled}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, features_enabled: checked }))
                  }
                />
              </div>
            </CardHeader>
            {formData.features_enabled && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input
                    value={formData.features_title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, features_title: e.target.value }))
                    }
                    placeholder="Why Choose Us"
                  />
                </div>

                <div className="space-y-4">
                  {formData.features.map((feature, index) => (
                    <div
                      key={feature.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-2" />
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Icon Name</Label>
                          <Input
                            value={feature.icon}
                            onChange={(e) =>
                              updateFeature(feature.id, "icon", e.target.value)
                            }
                            placeholder="Star, Heart, Shield..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            value={feature.title}
                            onChange={(e) =>
                              updateFeature(feature.id, "title", e.target.value)
                            }
                            placeholder="Feature title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            value={feature.description}
                            onChange={(e) =>
                              updateFeature(feature.id, "description", e.target.value)
                            }
                            placeholder="Feature description"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFeature(feature.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addFeature}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Feature
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Products Section</CardTitle>
                  <CardDescription>Display featured products on the landing page</CardDescription>
                </div>
                <Switch
                  checked={formData.products_enabled}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, products_enabled: checked }))
                  }
                />
              </div>
            </CardHeader>
            {formData.products_enabled && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input
                    value={formData.products_title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, products_title: e.target.value }))
                    }
                    placeholder="Featured Products"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Select Products</Label>
                  <p className="text-sm text-muted-foreground">
                    Selected: {formData.product_ids.length} products
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                  {products?.map((product) => (
                    <div
                      key={product.id}
                      className={`relative p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.product_ids.includes(product.id)
                          ? "border-primary bg-primary/5"
                          : "hover:border-muted-foreground/50"
                      }`}
                      onClick={() => toggleProduct(product.id)}
                    >
                      {product.images?.[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-24 object-cover rounded mb-2"
                        />
                      )}
                      <p className="text-sm font-medium line-clamp-2">{product.name}</p>
                      <p className="text-sm text-muted-foreground">৳{product.price}</p>
                      {formData.product_ids.includes(product.id) && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                          ✓
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Additional Sections Tab */}
        <TabsContent value="sections">
          <div className="space-y-4">
            {/* CTA Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Call to Action</CardTitle>
                    <CardDescription>Add a prominent CTA section</CardDescription>
                  </div>
                  <Switch
                    checked={formData.cta_enabled}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, cta_enabled: checked }))
                    }
                  />
                </div>
              </CardHeader>
              {formData.cta_enabled && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>CTA Title</Label>
                      <Input
                        value={formData.cta_title}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, cta_title: e.target.value }))
                        }
                        placeholder="Ready to Get Started?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA Subtitle</Label>
                      <Input
                        value={formData.cta_subtitle}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, cta_subtitle: e.target.value }))
                        }
                        placeholder="Join thousands of happy customers"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Button Text</Label>
                      <Input
                        value={formData.cta_button_text}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, cta_button_text: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Button Link</Label>
                      <Input
                        value={formData.cta_button_link}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, cta_button_link: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Background Color</Label>
                      <Input
                        type="color"
                        value={formData.cta_background_color}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            cta_background_color: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Testimonials Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Testimonials</CardTitle>
                    <CardDescription>Customer reviews and testimonials</CardDescription>
                  </div>
                  <Switch
                    checked={formData.testimonials_enabled}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, testimonials_enabled: checked }))
                    }
                  />
                </div>
              </CardHeader>
              {formData.testimonials_enabled && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Section Title</Label>
                    <Input
                      value={formData.testimonials_title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          testimonials_title: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {formData.testimonials.map((testimonial) => (
                    <div
                      key={testimonial.id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={testimonial.name}
                            onChange={(e) =>
                              updateTestimonial(testimonial.id, "name", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Input
                            value={testimonial.role}
                            onChange={(e) =>
                              updateTestimonial(testimonial.id, "role", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Avatar URL</Label>
                          <Input
                            value={testimonial.avatar}
                            onChange={(e) =>
                              updateTestimonial(testimonial.id, "avatar", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Content</Label>
                        <Textarea
                          value={testimonial.content}
                          onChange={(e) =>
                            updateTestimonial(testimonial.id, "content", e.target.value)
                          }
                          rows={2}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTestimonial(testimonial.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addTestimonial}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Testimonial
                  </Button>
                </CardContent>
              )}
            </Card>

            {/* FAQ Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>FAQ</CardTitle>
                    <CardDescription>Frequently asked questions</CardDescription>
                  </div>
                  <Switch
                    checked={formData.faq_enabled}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, faq_enabled: checked }))
                    }
                  />
                </div>
              </CardHeader>
              {formData.faq_enabled && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Section Title</Label>
                    <Input
                      value={formData.faq_title}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, faq_title: e.target.value }))
                      }
                    />
                  </div>

                  {formData.faqs.map((faq) => (
                    <div key={faq.id} className="p-4 border rounded-lg space-y-3">
                      <div className="space-y-2">
                        <Label>Question</Label>
                        <Input
                          value={faq.question}
                          onChange={(e) =>
                            updateFAQ(faq.id, "question", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Answer</Label>
                        <Textarea
                          value={faq.answer}
                          onChange={(e) =>
                            updateFAQ(faq.id, "answer", e.target.value)
                          }
                          rows={2}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFAQ(faq.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addFAQ}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add FAQ
                  </Button>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Search engine optimization settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input
                  value={formData.meta_title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, meta_title: e.target.value }))
                  }
                  placeholder="Page title for search engines"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.meta_title.length}/60 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  value={formData.meta_description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, meta_description: e.target.value }))
                  }
                  placeholder="Page description for search engines"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.meta_description.length}/160 characters
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Custom CSS</Label>
                <Textarea
                  value={formData.custom_css}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, custom_css: e.target.value }))
                  }
                  placeholder=".hero { background: linear-gradient(...); }"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLandingPageEditor;
