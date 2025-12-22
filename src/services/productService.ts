import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/types';

// Fetch all active products
export const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories:category_id (name, slug)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapProductFromDB);
};

// Fetch featured products
export const fetchFeaturedProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories:category_id (name, slug)
    `)
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapProductFromDB);
};

// Fetch new products
export const fetchNewProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories:category_id (name, slug)
    `)
    .eq('is_active', true)
    .eq('is_new', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapProductFromDB);
};

// Fetch single product by slug
export const fetchProductBySlug = async (slug: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories:category_id (name, slug)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapProductFromDB(data);
};

// Fetch all categories
export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data || []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    image: cat.image_url || '',
    productCount: 0, // Will be updated with actual count
  }));
};

// Helper function to map database product to frontend Product type
const mapProductFromDB = (data: any): Product => {
  const originalPrice = data.original_price ? Number(data.original_price) : undefined;
  const price = Number(data.price);
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : undefined;

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description || '',
    price: price,
    originalPrice: originalPrice,
    images: data.images || [],
    category: data.categories?.name || 'Uncategorized',
    subcategory: undefined,
    rating: Number(data.rating) || 0,
    reviewCount: data.review_count || 0,
    stock: data.stock || 0,
    featured: data.is_featured || false,
    isNew: data.is_new || false,
    discount: discount,
    tags: data.tags || [],
  };
};
