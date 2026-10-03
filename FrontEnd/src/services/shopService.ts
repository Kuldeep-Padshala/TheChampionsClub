import shopData from '../data/shop.json';
import { Product } from '../types/shop.types';

export const getProducts = async (): Promise<Product[]> => {
  return Promise.resolve(shopData as Product[]);
};

