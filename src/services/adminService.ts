import { supabase } from '@/integrations/supabase/client';

// Dashboard Stats
export const getDashboardStats = async () => {
  const [ordersResult, productsResult, usersResult, revenueResult] = await Promise.all([
    supabase.from('orders').select('id, total, status, created_at'),
    supabase.from('products').select('id, stock, is_active'),
    supabase.from('profiles').select('id'),
    supabase.from('orders').select('total').eq('payment_status', 'paid'),
  ]);

  const orders = ordersResult.data || [];
  const products = productsResult.data || [];
  const users = usersResult.data || [];
  const paidOrders = revenueResult.data || [];

  const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const lowStockProducts = products.filter(p => p.stock < 10 && p.is_active).length;

  // Get recent orders for chart
  const last7Days = orders.filter(o => {
    const orderDate = new Date(o.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return orderDate >= weekAgo;
  });

  return {
    totalOrders: orders.length,
    totalProducts: products.length,
    totalUsers: users.length,
    totalRevenue,
    pendingOrders,
    lowStockProducts,
    recentOrders: last7Days,
  };
};

// Products CRUD
export const getAllProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories:category_id (id, name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createProduct = async (product: {
  name: string;
  slug: string;
  description?: string;
  price: number;
  original_price?: number;
  category_id?: string;
  stock: number;
  images?: string[];
  tags?: string[];
  is_featured?: boolean;
  is_new?: boolean;
  is_active?: boolean;
  features?: string;
  composition?: string;
  care_instructions?: string;
}) => {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateProduct = async (id: string, updates: Partial<{
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price: number;
  category_id: string;
  stock: number;
  images: string[];
  tags: string[];
  is_featured: boolean;
  is_new: boolean;
  is_active: boolean;
  features: string;
  composition: string;
  care_instructions: string;
}>) => {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteProduct = async (id: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Categories CRUD
export const getAllCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data;
};

export const createCategory = async (category: {
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  sort_order?: number;
}) => {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCategory = async (id: string, updates: Partial<{
  name: string;
  slug: string;
  description: string;
  image_url: string;
  parent_id: string;
  sort_order: number;
}>) => {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCategory = async (id: string) => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Orders Management
export const getAllOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const updateOrderStatus = async (id: string, status: string, trackingNumber?: string) => {
  const updates: { status: string; tracking_number?: string } = { status };
  if (trackingNumber) {
    updates.tracking_number = trackingNumber;
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Users Management
export const getAllUsers = async () => {
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (profilesError) throw profilesError;

  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role');

  if (rolesError) throw rolesError;

  // Merge profiles with roles
  return profiles?.map(profile => ({
    ...profile,
    user_roles: roles?.filter(r => r.user_id === profile.user_id) || []
  })) || [];
};

export const updateUserRole = async (userId: string, role: 'admin' | 'user') => {
  const { data: existing } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('user_roles')
      .update({ role })
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('user_roles')
      .insert([{ user_id: userId, role }]);
    if (error) throw error;
  }
};

// Inventory (Stock Management)
export const getLowStockProducts = async (threshold = 10) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .lt('stock', threshold)
    .eq('is_active', true)
    .order('stock', { ascending: true });

  if (error) throw error;
  return data;
};

export const updateProductStock = async (id: string, stock: number) => {
  const { data, error } = await supabase
    .from('products')
    .update({ stock })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Banners Management
export const getAllBanners = async () => {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data;
};

export const createBanner = async (banner: {
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  is_active?: boolean;
  sort_order?: number;
}) => {
  const { data, error } = await supabase
    .from('banners')
    .insert([banner])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateBanner = async (id: string, updates: Partial<{
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  sort_order: number;
}>) => {
  const { data, error } = await supabase
    .from('banners')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteBanner = async (id: string) => {
  const { error } = await supabase
    .from('banners')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Draft/Incomplete Orders
export const getAllDraftOrders = async () => {
  const { data, error } = await supabase
    .from('draft_orders')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const deleteDraftOrder = async (id: string) => {
  const { error } = await supabase
    .from('draft_orders')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
