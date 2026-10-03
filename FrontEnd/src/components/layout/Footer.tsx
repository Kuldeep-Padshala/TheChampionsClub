import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, MapPin, Phone, Mail, Clock, Globe, Share2, ExternalLink } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { CLUB_INFO } from '../../constants/club';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#F5F5F7] text-[#1D1D1F] border-t border-black/[0.08] text-xs">
      {/* Main footer content grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Column 1: Brand and tagline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1D1D1F] flex items-center justify-center flex-shrink-0 text-white">
                <Trophy size={14} className="text-[#B89047]" />
              </div>
              <span className="text-base font-semibold tracking-tight text-[#1D1D1F]">
                {CLUB_INFO.shortName}
              </span>
            </div>
            <p className="text-xs text-[#86868B] leading-relaxed">
              Bengaluru's premier athletic club. Designed for tennis, cricket, and community wellness.
            </p>
            {/* Social media icons */}
            <div className="flex gap-4 pt-1 text-[#86868B]">
              <a href={CLUB_INFO.social.instagram} className="hover:text-[#1D1D1F] transition-colors" aria-label="Instagram">
                <Globe size={18} />
              </a>
              <a href={CLUB_INFO.social.twitter} className="hover:text-[#1D1D1F] transition-colors" aria-label="Twitter/X">
                <Share2 size={18} />
              </a>
              <a href={CLUB_INFO.social.facebook} className="hover:text-[#1D1D1F] transition-colors" aria-label="Facebook">
                <ExternalLink size={18} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1D1D1F] mb-3">Explore Club</h4>
            <ul className="space-y-2">
              {[
                { label: 'Book a Court',   to: ROUTES.COURTS      },
                { label: 'Pro Shop',       to: ROUTES.SHOP        },
                { label: 'Cafe & Bar',     to: ROUTES.CAFE        },
                { label: 'Memberships',    to: ROUTES.MEMBERSHIPS },
                { label: 'Our Story',      to: ROUTES.ABOUT       },
                { label: 'Contact Us',     to: ROUTES.CONTACT     },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-[#86868B] hover:text-[#1D1D1F] hover:underline transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact info */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1D1D1F] mb-3">Location &amp; Inquiries</h4>
            <ul className="space-y-2.5 text-[#86868B]">
              <li className="flex items-start gap-2.5">
                <MapPin size={15} className="text-[#1D1D1F] flex-shrink-0 mt-0.5" />
                <span>{CLUB_INFO.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={15} className="text-[#1D1D1F] flex-shrink-0" />
                <span>{CLUB_INFO.phone}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={15} className="text-[#1D1D1F] flex-shrink-0" />
                <a href={`mailto:${CLUB_INFO.email}`} className="hover:underline hover:text-[#1D1D1F]">
                  {CLUB_INFO.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Opening hours */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1D1D1F] mb-3">Hours of Operation</h4>
            <ul className="space-y-2 text-[#86868B]">
              <li className="flex items-center gap-2">
                <Clock size={14} className="text-[#1D1D1F]" />
                <span className="font-semibold text-[#1D1D1F]">Monday – Friday</span>
              </li>
              <li className="pl-6">Courts: 6:00 AM – 10:00 PM</li>
              <li className="pl-6">Pro Shop: 9:00 AM – 8:00 PM</li>
              <li className="flex items-center gap-2 mt-2">
                <Clock size={14} className="text-[#1D1D1F]" />
                <span className="font-semibold text-[#1D1D1F]">Saturday – Sunday</span>
              </li>
              <li className="pl-6">Courts: 6:00 AM – 11:00 PM</li>
              <li className="pl-6">Pro Shop: 8:00 AM – 9:00 PM</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Apple-style Bottom bar */}
      <div className="border-t border-black/[0.06] py-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[#86868B]">
          <p>
            Copyright © {currentYear} {CLUB_INFO.name}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="hover:underline hover:text-[#1D1D1F]">Privacy Policy</a>
            <a href="#" className="hover:underline hover:text-[#1D1D1F]">Terms of Booking</a>
            <a href="#" className="hover:underline hover:text-[#1D1D1F]">Club Rules</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
