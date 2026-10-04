import api from '../api/client';
import shopData from '../data/shop.json';
import { Product } from '../types/shop.types';

export const getProducts = async (): Promise<Product[]> => {
  try {
    const res = await api.get('/public/products');
    if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
      return res.data.data?.map((p: any) => ({
        id: String(p.id),
        name: p.name,
        category: (p.category_name || 'Rackets').toLowerCase().includes('shoe')
          ? 'footwear'
          : (p.category_name || '').toLowerCase().includes('apparel')
          ? 'apparel'
          : (p.category_name || '').toLowerCase().includes('access')
          ? 'accessories'
          : 'rackets',
        price: Number(p.base_price) || 2999,
        image: p.image_url || 'https://images.unsplash.com/photo-1617083934555-563212879685?q=80&w=800&auto=format&fit=crop',
        description: p.description || `${p.brand || 'Pro'} tournament grade gear.`,
        inStock: true,
        specs: {
          brand: p.brand || 'The Champions Club',
          warranty: '1 Year Manufacturer',
        },
      }));
    }
  } catch (err) {
    console.warn('[getProducts] falling back to seed products', err);
  }
  return Promise.resolve(shopData as Product[]);
};
