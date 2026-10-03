import React from 'react';
import { Court } from '../../types/court.types';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatPrice } from '../../utils/priceUtils';
import { Wifi, Zap, Droplets, Users } from 'lucide-react';

interface CourtCardProps {
  court: Court;
  onBook: () => void;
}

// Map amenity text to a small icon (for common amenities)
const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'Floodlights':   <Zap size={12} />,
  'Water Station': <Droplets size={12} />,
  'Seating':       <Users size={12} />,
};

export const CourtCard: React.FC<CourtCardProps> = ({ court, onBook }) => {
  return (
    <Card className="flex flex-col h-full group hover:shadow-lg hover:-translate-y-1 transition-all">
      {/* Court image */}
      <div className="relative h-52 w-full overflow-hidden rounded-t-xl">
        <img
          src={court.imageUrl}
          alt={court.name}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        {/* Sport type badge (top-left overlay) */}
        <div className="absolute top-3 left-3">
          <Badge variant="gold" className="capitalize shadow-sm">
            {court.sport}
          </Badge>
        </div>
      </div>

      <CardContent className="flex-1 flex flex-col p-6">
        {/* Court name */}
        <h3 className="text-xl font-display font-bold text-navy-primary mb-2">{court.name}</h3>
        {/* Description */}
        <p className="text-sm text-text-secondary mb-4 line-clamp-2 leading-relaxed flex-1">
          {court.description}
        </p>

        {/* Amenity chips */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {court.amenities.map(amenity => (
            <span
              key={amenity}
              className="flex items-center gap-1 text-xs bg-bg-subtle text-navy-mid px-2.5 py-1 rounded-full border border-border"
            >
              {AMENITY_ICONS[amenity] || null}
              {amenity}
            </span>
          ))}
        </div>

        {/* Pricing table */}
        <div className="space-y-2 mb-6 bg-bg-subtle rounded-xl p-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary">Walk-in</span>
            <span className="font-semibold text-text-primary">
              {formatPrice(court.pricePerHour.walkin)}/hr
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-navy-mid font-medium">Silver Member</span>
            <span className="font-semibold text-navy-primary">
              {formatPrice(court.pricePerHour.silver)}/hr
            </span>
          </div>
          <div className="flex justify-between items-center text-sm border-t border-border pt-2 mt-1">
            <span className="text-gold-primary font-semibold">⭐ Gold Member</span>
            <span className="font-bold text-gold-primary">
              {court.pricePerHour.gold === 0 ? 'FREE' : formatPrice(court.pricePerHour.gold) + '/hr'}
            </span>
          </div>
        </div>

        {/* CTA button */}
        <Button onClick={onBook} className="w-full">
          View Slots &amp; Book
        </Button>
      </CardContent>
    </Card>
  );
};
