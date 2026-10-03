import React from 'react';
import { Product } from '../../types/shop.types';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatPrice } from '../../utils/priceUtils';
import { ShoppingCart, Package } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onBuy: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onBuy }) => {
  const isOutOfStock = product.stock === 'out-of-stock';

  return (
    <Card className="flex flex-col h-full group hover:shadow-md hover:-translate-y-1 transition-all">
      {/* Product image container */}
      <div className="relative h-52 w-full p-4 bg-white flex items-center justify-center overflow-hidden rounded-t-xl">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
        {/* Stock badges (top-left corner) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.stock === 'low-stock' && (
            <Badge variant="warning">Low Stock</Badge>
          )}
          {product.stock === 'out-of-stock' && (
            <Badge variant="danger">Out of Stock</Badge>
          )}
        </div>
      </div>

      <CardContent className="flex-1 flex flex-col p-5 border-t border-border">
        {/* Brand label */}
        <div className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-1">
          {product.brand}
        </div>
        {/* Product name */}
        <h3 className="text-base font-semibold text-navy-primary mb-3 line-clamp-2 flex-1">
          {product.name}
        </h3>

        {/* Pricing block */}
        <div className="space-y-1 mb-4">
          {/* Member price — highlighted in gold */}
          {product.memberPrice && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-navy-mid font-medium">Member Price</span>
              <span className="text-base font-bold text-gold-primary">
                {formatPrice(product.memberPrice)}
              </span>
            </div>
          )}
          {/* Regular / walk-in price */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary">
              {product.memberPrice ? 'Regular Price' : 'Price'}
            </span>
            <span
              className={
                product.memberPrice
                  ? 'text-xs text-text-secondary line-through'
                  : 'text-base font-bold text-navy-primary'
              }
            >
              {formatPrice(product.price)}
            </span>
          </div>
        </div>

        {/* Add to Cart / Sold Out button */}
        <Button
          onClick={onBuy}
          disabled={isOutOfStock}
          className="w-full gap-2 flex items-center justify-center"
          variant={isOutOfStock ? 'ghost' : 'primary'}
        >
          {isOutOfStock ? (
            <>
              <Package size={15} />
              Sold Out
            </>
          ) : (
            <>
              <ShoppingCart size={15} />
              Add to Cart
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
