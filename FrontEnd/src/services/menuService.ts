import api from '../api/client';
import menuData from '../data/menu.json';
import { MenuItem } from '../types/menu.types';

export const getMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const res = await api.get('/public/menu');
    if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
      return res.data.data.map((item: any) => {
        const catName = (item.category_name || '').toLowerCase();
        const cat: 'food' | 'drinks' | 'bar' = catName.includes('cocktail') || catName.includes('wine') || catName.includes('beer') || catName.includes('bar')
          ? 'bar'
          : catName.includes('beverage') || catName.includes('smoothie') || catName.includes('coffee') || catName.includes('drink')
          ? 'drinks'
          : 'food';

        return {
          id: String(item.id),
          name: item.name,
          description: item.description || 'Artisanal preparation from our clubhouse kitchen.',
          price: Number(item.price) || 250,
          category: cat,
          isVeg: !item.name.toLowerCase().includes('chicken') && !item.name.toLowerCase().includes('meat') && !item.name.toLowerCase().includes('fish'),
          imageUrl: item.image_url || undefined,
          memberDiscount: 15,
        };
      });
    }
  } catch (err) {
    console.warn('[getMenuItems] falling back to seed menu', err);
  }
  return Promise.resolve(menuData as MenuItem[]);
};
