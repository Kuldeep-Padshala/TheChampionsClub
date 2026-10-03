import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Trophy } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { CLUB_INFO } from '../../constants/club';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

// Navigation links shown in the top nav bar
const NAV_LINKS = [
  { name: 'Courts',       path: ROUTES.COURTS      },
  { name: 'Shop',         path: ROUTES.SHOP        },
  { name: 'Cafe & Bar',   path: ROUTES.CAFE        },
  { name: 'Memberships',  path: ROUTES.MEMBERSHIPS },
  { name: 'About',        path: ROUTES.ABOUT       },
  { name: 'Contact',      path: ROUTES.CONTACT     },
];

export const Navbar = () => {
  const location = useLocation();
  // Controls mobile drawer open/close
  const [mobileOpen, setMobileOpen] = useState(false);
  // Tracks scroll to add background shadow
  const [scrolled, setScrolled] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Add shadow when user scrolls down
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Main navbar strip */}
      <nav
        className={cn(
          'sticky top-0 z-40 w-full transition-all duration-300 glass-nav',
          scrolled && 'luxury-shadow border-b-transparent'
        )}
      >
        <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">

          {/* Brand logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gold-primary flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-2xl text-navy-primary tracking-tight leading-none">
              {CLUB_INFO.shortName}
            </span>
          </Link>

          {/* Desktop navigation links */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-gold-primary relative group',
                  location.pathname === link.path
                    ? 'text-gold-primary'
                    : 'text-navy-mid'
                )}
              >
                {link.name}
                {/* Gold underline on active link */}
                <span
                  className={cn(
                    'absolute -bottom-0.5 left-0 h-0.5 bg-gold-primary transition-all',
                    location.pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'
                  )}
                />
              </Link>
            ))}
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link to={ROUTES.LOGIN}>
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link to={ROUTES.REGISTER}>
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <button
            className="lg:hidden text-navy-primary p-2 rounded-md hover:bg-bg-subtle transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-navy-primary/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer panel */}
      <div
        className={cn(
          'fixed top-16 left-0 right-0 z-40 bg-bg-surface border-b border-border shadow-xl lg:hidden transition-all duration-300 overflow-hidden',
          mobileOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="container mx-auto px-4 py-6 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                'block px-4 py-3 rounded-lg text-base font-medium transition-colors',
                location.pathname === link.path
                  ? 'bg-gold-primary/10 text-gold-primary'
                  : 'text-navy-mid hover:bg-bg-subtle hover:text-navy-primary'
              )}
            >
              {link.name}
            </Link>
          ))}

          {/* Auth buttons in mobile drawer */}
          <div className="pt-4 pb-2 flex flex-col gap-3 border-t border-border mt-4">
            <Link to={ROUTES.LOGIN} className="w-full">
              <Button variant="outline" className="w-full">Log In</Button>
            </Link>
            <Link to={ROUTES.REGISTER} className="w-full">
              <Button className="w-full">Sign Up — Join The Club</Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};
