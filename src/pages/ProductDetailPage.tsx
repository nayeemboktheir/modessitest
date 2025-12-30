import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, 
  ShoppingCart, 
  Minus, 
  Plus, 
  ChevronLeft,
  ChevronRight,
  Loader2,
  Phone,
  MessageCircle,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductCard from '@/components/products/ProductCard';
import { fetchProductBySlug, fetchProducts } from '@/services/productService';
import { Product } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart, openCart } from '@/store/slices/cartSlice';
import { toggleWishlist, selectWishlistItems } from '@/store/slices/wishlistSlice';
import { toast } from 'sonner';
import { useFacebookPixel } from '@/hooks/useFacebookPixel';

const ProductDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector(selectWishlistItems);
  const { trackViewContent, trackAddToCart, isReady } = useFacebookPixel();

  const isInWishlist = product ? wishlistItems.some((item) => item.id === product.id) : false;

  // Track ViewContent when product loads
  useEffect(() => {
    if (product && isReady) {
      console.log('Firing ViewContent for product:', product.name);
      trackViewContent({
        content_ids: [product.id],
        content_name: product.name,
        content_type: 'product',
        value: product.price,
        currency: 'BDT',
      });
    }
  }, [product, isReady, trackViewContent]);

  useEffect(() => {
    const loadProduct = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        const [productData, allProducts] = await Promise.all([
          fetchProductBySlug(slug),
          fetchProducts(),
        ]);
        setProduct(productData);
        if (productData) {
          setRelatedProducts(
            allProducts
              .filter((p) => p.category === productData.category && p.id !== productData.id)
              .slice(0, 4)
          );
        }
      } catch (error) {
        console.error('Failed to load product:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProduct();
    window.scrollTo(0, 0);
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-40 pb-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-40 pb-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
          <Button asChild>
            <Link to="/products">Back to Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => `৳${price.toLocaleString('en-BD')}`;
  const discountAmount = product.originalPrice ? product.originalPrice - product.price : 0;

  const handleAddToCart = () => {
    dispatch(addToCart({ product, quantity }));
    dispatch(openCart());
    
    // Track AddToCart event
    console.log('Firing AddToCart for product:', product.name);
    trackAddToCart({
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: product.price * quantity,
      currency: 'BDT',
    });
    
    toast.success('Added to cart!');
  };

  const handleBuyNow = () => {
    dispatch(addToCart({ product, quantity }));
    
    // Track AddToCart event
    trackAddToCart({
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: product.price * quantity,
      currency: 'BDT',
    });
    
    navigate('/checkout');
  };

  const handleToggleWishlist = () => {
    dispatch(toggleWishlist(product));
    toast.success(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist!');
  };

  const handleCallNow = () => {
    window.location.href = 'tel:01820-808514';
  };

  const handleMessenger = () => {
    const message = encodeURIComponent(
      `Hi. I Want To Buy ${product.name} | Quantity: ${quantity} | Price: ৳${product.price * quantity} | ${window.location.href}`
    );
    window.open(`https://m.me/your-page-name/?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen pt-32 pb-16 bg-background">
      <div className="container-custom">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center gap-2 text-muted-foreground">
            <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li className="text-muted-foreground/50">›</li>
            <li><Link to="/products" className="hover:text-primary transition-colors">Products</Link></li>
            <li className="text-muted-foreground/50">›</li>
            <li className="text-foreground truncate max-w-[200px]">{product.name}</li>
          </ol>
          <Link 
            to="/" 
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary mt-2 text-sm transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back To Home
          </Link>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-4 border border-border">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />

              {/* Navigation Arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage((prev) => 
                      prev === 0 ? product.images.length - 1 : prev - 1
                    )}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors shadow-md"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImage((prev) => 
                      prev === product.images.length - 1 ? 0 : prev + 1
                    )}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors shadow-md"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails - Horizontal Scroll Gallery */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                      selectedImage === index 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-5"
          >
            {/* Title with Share Icons */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground leading-tight">
                {product.name}
              </h1>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleToggleWishlist}
                className={`flex-shrink-0 ${isInWishlist ? 'text-secondary' : 'text-muted-foreground hover:text-secondary'}`}
              >
                <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* SKU */}
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">SKU:</span> {product.id.slice(0, 8).toUpperCase()}
            </p>

            {/* Price Section */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground">PRICE:</span>
              <span className="text-2xl font-bold text-foreground">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0">
                    {discountAmount} ৳ off
                  </Badge>
                </>
              )}
            </div>

            {/* Size Selector (if tags include sizes) */}
            {product.tags && product.tags.some(tag => ['S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36'].includes(tag)) && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Select Size: <span className="text-primary">{product.tags.find(tag => ['S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36'].includes(tag))}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.tags
                    .filter(tag => ['S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36'].includes(tag))
                    .map((size) => (
                      <button
                        key={size}
                        className="px-4 py-2 border-2 border-primary rounded-md text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {size}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">STATUS:</span>
              <span className={`font-bold ${product.stock > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* Happy Customers Badge */}
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="font-semibold">14,360+ Happy Customers</span>
            </div>

            {/* Short Description / Features */}
            <div className="space-y-3">
              <p className="font-semibold text-foreground">{product.description}</p>
              <div className="text-sm text-muted-foreground space-y-1.5">
                <p className="font-medium text-foreground">Features:</p>
                <ul className="space-y-1 list-none">
                  <li>- Premium quality material</li>
                  <li>- Comfortable and stylish fit</li>
                  <li>- Easy care and maintenance</li>
                  <li>- Available in multiple sizes</li>
                  <li>- Perfect for all occasions</li>
                </ul>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 pt-2 border-t border-border">
              <span className="text-sm font-bold text-foreground uppercase">Quantity</span>
              <div className="flex items-center border border-border rounded-md overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-medium text-foreground py-2 border-x border-border">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button 
                variant="outline"
                size="lg" 
                className="w-full font-semibold"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              <Button 
                size="lg" 
                className="w-full bg-foreground text-background hover:bg-foreground/90 font-semibold"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
              >
                Buy Now
              </Button>
            </div>

            {/* Call Now Button */}
            <Button 
              variant="outline"
              size="lg" 
              className="w-full bg-amber-500 hover:bg-amber-600 text-white border-0 font-semibold"
              onClick={handleCallNow}
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Now: 01820-808514
            </Button>

            {/* Messenger Button */}
            <Button 
              variant="outline"
              size="lg" 
              className="w-full bg-background border-2 border-foreground hover:bg-muted font-semibold"
              onClick={handleMessenger}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              ম্যাসেঞ্জার অর্ডার
            </Button>

            {/* Delivery Notice */}
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground border border-border">
              <p>
                ডেলিভারি চার্জ এডভান্স পে করে অর্ডার কনফার্ম করতে হবে। 
                <span className="font-medium text-foreground"> "ঢাকার মধ্যে ৮০ টাকা" </span>
                <span className="font-medium text-foreground">"ঢাকার বাইরে ১৩০ টাকা।"</span>
              </p>
              <p className="mt-2">
                বিকাশ পেমেন্ট নাম্বার: <span className="font-medium text-foreground">01820-808514</span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Product Description Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12"
        >
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0 mb-6">
              <TabsTrigger 
                value="description" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 text-base font-medium text-muted-foreground data-[state=active]:text-primary"
              >
                পন্যের বিবরণ
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-0">
              <div className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 rounded-r-lg p-6">
                {/* Main Description */}
                <h3 className="font-bold text-foreground text-lg mb-3">
                  {product.description || `Premium ${product.category} with a stylish design`}
                </h3>
                <p className="text-muted-foreground mb-6">
                  The stretchable fabric's casual style is emphasized by the genuine garment-washed effects. 
                  Because of the high-stretch fabric and premium construction, this product is a hit and is easy to wear all day.
                </p>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="font-bold text-foreground mb-3">Features:</h4>
                  <ul className="space-y-1.5 text-muted-foreground">
                    <li>- Premium quality material, Mid Weight</li>
                    <li>- Stretchable and Extra-soft to the touch</li>
                    <li>- High quality stitching & finishing</li>
                    <li>- Comfortable design with attention to detail</li>
                    <li>- Premium embroidery/print finishing</li>
                    <li>- Perfect fit, excellent stretch, and recovery to the body yet still easy to wear</li>
                    <li>- Will Not Shrink</li>
                    <li>- Premium branding</li>
                  </ul>
                </div>

                {/* Composition */}
                <div className="mb-6">
                  <h4 className="font-bold text-foreground mb-3">Composition</h4>
                  <ul className="space-y-1.5 text-muted-foreground">
                    <li>- Materials: Premium quality fabric</li>
                    <li>- Pre-Shrunk and color-fast</li>
                    <li>- Professional finishing</li>
                  </ul>
                </div>

                {/* Care Instructions */}
                <div>
                  <h4 className="font-bold text-foreground mb-3">Care</h4>
                  <ul className="space-y-1.5 text-muted-foreground">
                    <li>- Machine wash in cold (30°C) water</li>
                    <li>- Dry: Do Not Tumble Dry</li>
                    <li>- Bleach: Do Not Bleach</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-16 border-t border-border">
            <h2 className="text-2xl font-display font-bold text-foreground mb-8">
              Related Products
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((relatedProduct, index) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} index={index} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
