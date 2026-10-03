import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, MapPin, Phone, Mail, Clock, Globe, Share2, ExternalLink } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { CLUB_INFO } from '../../constants/club';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-navy-primary text-cream">
      {/* Main footer content grid */}
      <div className="container mx-auto px-4 md:px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Column 1: Brand and tagline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gold-primary flex items-center justify-center flex-shrink-0">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-2xl font-bold text-gold-primary">
                {CLUB_INFO.shortName}
              </span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              The premier destination for sports excellence, fitness, and vibrant community life.
            </p>
            {/* Social media icons */}
            <div className="flex gap-4 pt-2">
              <a href={CLUB_INFO.social.instagram} className="text-gray-400 hover:text-gold-primary transition-colors" aria-label="Instagram">
                <Globe size={20} />
              </a>
              <a href={CLUB_INFO.social.twitter} className="text-gray-400 hover:text-gold-primary transition-colors" aria-label="Twitter/X">
                <Share2 size={20} />
              </a>
              <a href={CLUB_INFO.social.facebook} className="text-gray-400 hover:text-gold-primary transition-colors" aria-label="Facebook">
                <ExternalLink size={20} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick links */}
          <div>
            <h4 className="font-display text-base font-semibold text-gold-light mb-4">Explore</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Book a Court',   to: ROUTES.COURTS      },
                { label: 'Pro Shop',       to: ROUTES.SHOP        },
                { label: 'Cafe & Bar',     to: ROUTES.CAFE        },
                { label: 'Memberships',    to: ROUTES.MEMBERSHIPS },
                { label: 'About the Club', to: ROUTES.ABOUT       },
                { label: 'Contact Us',     to: ROUTES.CONTACT     },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-gray-300 hover:text-gold-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact info */}
          <div>
            <h4 className="font-display text-base font-semibold text-gold-light mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-gold-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-300">{CLUB_INFO.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-gold-primary flex-shrink-0" />
                <span className="text-sm text-gray-300">{CLUB_INFO.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-gold-primary flex-shrink-0" />
                <a href={`mailto:${CLUB_INFO.email}`} className="text-sm text-gray-300 hover:text-gold-primary transition-colors">
                  {CLUB_INFO.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Opening hours */}
          <div>
            <h4 className="font-display text-base font-semibold text-gold-light mb-4">Hours</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <Clock size={14} className="text-gold-primary" />
                <span className="font-medium">Mon – Fri</span>
              </li>
              <li className="pl-5">Courts: 6:00 AM – 10:00 PM</li>
              <li className="pl-5">Shop: 9:00 AM – 8:00 PM</li>
              <li className="flex items-center gap-2 mt-3">
                <Clock size={14} className="text-gold-primary" />
                <span className="font-medium">Sat – Sun</span>
              </li>
              <li className="pl-5">Courts: 6:00 AM – 11:00 PM</li>
              <li className="pl-5">Shop: 8:00 AM – 9:00 PM</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-navy-mid">
        <div className="container mx-auto px-4 md:px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-sm text-gray-400">
            © {currentYear} {CLUB_INFO.name}. All rights reserved.
          </p>
          <div className="flex gap-5 text-sm text-gray-400">
            <a href="#" className="hover:text-gold-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gold-primary transition-colors">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
