import menuData from '../data/menu.json';
import { MenuItem } from '../types/menu.types';

export const getMenuItems = async (): Promise<MenuItem[]> => {
  return Promise.resolve(menuData as MenuItem[]);
};

