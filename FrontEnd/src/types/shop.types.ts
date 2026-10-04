export interface Product {
  id: string;
  name: string;
  brand: string;
  category: 'rackets' | 'balls' | 'shoes' | 'accessories' | 'apparel';
  sport: 'tennis' | 'cricket' | 'badminton' | 'general';
  price: number;
  memberPrice?: number;
  imageUrl: string;
  stock: 'in-stock' | 'low-stock' | 'out-of-stock';
}

