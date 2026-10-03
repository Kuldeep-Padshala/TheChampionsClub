export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'food' | 'drinks' | 'bar';
  isVeg: boolean;
  imageUrl?: string;
  memberDiscount?: number;
}

