import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { ROUTES } from '../constants/routes';
import { CLUB_INFO } from '../constants/club';
import { Trophy, Eye, EyeOff } from 'lucide-react';

export const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // In Phase 1: show "coming soon" toast
  // In Phase 2: POST to /api/auth/register
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  return (
    <PageLayout>
      <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-bg-subtle">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-bg-surface rounded-2xl border border-border shadow-lg p-8 md:p-10">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-full bg-gold-primary flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <h1 className="font-display text-3xl font-bold text-navy-primary mb-1">
                Create Account
              </h1>
              <p className="text-text-secondary text-sm">
                Join {CLUB_INFO.shortName} today
              </p>
            </div>

            {/* Registration form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-navy-primary">First Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Rohit"
                    className="w-full p-3 rounded-lg border border-border focus:ring-2 focus:ring-gold-primary outline-none text-sm bg-bg-subtle"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-navy-primary">Last Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Sharma"
                    className="w-full p-3 rounded-lg border border-border focus:ring-2 focus:ring-gold-primary outline-none text-sm bg-bg-subtle"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-navy-primary">Email</label>
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  className="w-full p-3 rounded-lg border border-border focus:ring-2 focus:ring-gold-primary outline-none text-sm bg-bg-subtle"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-navy-primary">Phone</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="w-full p-3 rounded-lg border border-border focus:ring-2 focus:ring-gold-primary outline-none text-sm bg-bg-subtle"
                />
              </div>

              {/* Membership plan selector */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-navy-primary">Interested in</label>
                <select className="w-full p-3 rounded-lg border border-border focus:ring-2 focus:ring-gold-primary outline-none text-sm bg-bg-subtle cursor-pointer">
                  <option value="">Select a membership plan</option>
                  <option value="gold">Gold — ₹5,000/month (Full Access)</option>
                  <option value="silver">Silver — ₹2,500/month (Standard)</option>
                  <option value="junior">Junior — ₹1,500/month (Under 18)</option>
                  <option value="trial">Trial Visit (No membership yet)</option>
                </select>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-navy-primary">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    className="w-full p-3 pr-10 rounded-lg border border-border focus:ring-2 focus:ring-gold-primary outline-none text-sm bg-bg-subtle"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-navy-primary"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 mt-2">
                Create My Account
              </Button>

              <p className="text-xs text-text-secondary text-center">
                By registering, you agree to our{' '}
                <a href="#" className="text-gold-primary hover:underline">Terms of Use</a>{' '}
                and{' '}
                <a href="#" className="text-gold-primary hover:underline">Privacy Policy</a>.
              </p>
            </form>

            {/* Phase 1 coming soon toast */}
            {showToast && (
              <div className="mt-5 bg-blue-50 text-blue-800 p-4 rounded-lg border border-blue-200 text-sm text-center font-medium">
                🚀 Account creation is coming in Phase 2. We're building it for you!
              </div>
            )}

            {/* Login link */}
            <div className="mt-8 pt-6 border-t border-border text-center text-sm text-text-secondary">
              Already a member?{' '}
              <Link to={ROUTES.LOGIN} className="text-gold-primary font-bold hover:underline">
                Log In
              </Link>
            </div>
          </div>

          {/* Back to home */}
          <div className="text-center mt-6">
            <Link to={ROUTES.HOME} className="text-sm text-text-secondary hover:text-navy-primary transition-colors">
              ← Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
