import React, { useEffect, useState } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { SectionHeader } from '../components/ui/SectionHeader';
import { MenuCard } from '../components/cafe/MenuCard';
import { MenuCategoryTabs } from '../components/cafe/MenuCategoryTabs';
import { getMenuItems } from '../services/menuService';
import { MenuItem } from '../types/menu.types';
import { useLoginPrompt } from '../hooks/useLoginPrompt';
import { Clock, Star, Percent } from 'lucide-react';

export const CafePage = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  // Controls which tab is active: food | drinks | bar
  const [activeTab, setActiveTab] = useState<'food' | 'drinks' | 'bar'>('food');
  const { requireLogin } = useLoginPrompt();

  useEffect(() => {
    getMenuItems().then(setMenu);
  }, []);

  // Filter menu items to only show the currently active tab
  const filteredMenu = menu.filter(item => item.category === activeTab);

  return (
    <PageLayout>

      {/* ── Page hero with background */}
      <div
        className="relative bg-navy-primary text-cream py-20 md:py-28 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=2000&auto=format&fit=crop')",
        }}
      >
        {/* Dark overlay to keep text readable */}
        <div className="absolute inset-0 bg-navy-900/80 backdrop-blur-sm" />
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-gold-primary/20 border border-gold-primary/30 text-gold-light rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Star size={14} />
            <span>Members get up to 15% off</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gold-primary mb-4">
            The Clubhouse Cafe &amp; Bar
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Refuel after a match or relax with friends. Fresh food, premium drinks, and a bar
            that stays open late on match nights.
          </p>
        </div>
      </div>

      {/* ── Menu section ── */}
      <div className="container mx-auto px-4 md:px-6 py-12">

        {/* Tab switcher: Food / Drinks / Bar */}
        <MenuCategoryTabs activeTab={activeTab} onChange={setActiveTab} />

        {/* Empty state if no items in category */}
        {filteredMenu.length === 0 ? (
          <div className="text-center py-20 text-text-secondary border border-dashed border-border rounded-xl">
            Menu items for this category are being updated. Check back soon!
          </div>
        ) : (
          /* 2-column menu grid on large screens */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl mx-auto">
            {filteredMenu.map(item => (
              <MenuCard
                key={item.id}
                item={item}
                onOrder={() => requireLogin('place an order')}
              />
            ))}
          </div>
        )}

        {/* ── Info cards row at bottom ── */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Opening hours */}
          <div className="bg-bg-surface border border-border rounded-xl p-6 flex gap-4 items-start">
            <div className="w-10 h-10 bg-bg-subtle rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="text-gold-primary" size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-navy-primary mb-2">Hours</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Cafe &amp; Kitchen: 7 AM – 10 PM<br />
                The Bar: 4 PM – 11:30 PM<br />
                (Extended on weekends)
              </p>
            </div>
          </div>

          {/* Member discount */}
          <div className="bg-gold-primary/5 border border-gold-primary/20 rounded-xl p-6 flex gap-4 items-start">
            <div className="w-10 h-10 bg-gold-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Percent className="text-gold-primary" size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-navy-primary mb-2">Member Discount</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Gold members: 15% off<br />
                Silver members: 10% off<br />
                Applied automatically at checkout
              </p>
            </div>
          </div>

          {/* Tab / run a tab */}
          <div className="bg-bg-surface border border-border rounded-xl p-6 flex gap-4 items-start">
            <div className="w-10 h-10 bg-bg-subtle rounded-full flex items-center justify-center flex-shrink-0">
              <Star className="text-gold-primary" size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-navy-primary mb-2">Run a Tab</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Gold members can run a monthly tab and settle at month-end. No carrying cash on the court.
              </p>
            </div>
          </div>
        </div>
      </div>

    </PageLayout>
  );
};
