import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { ROUTES } from '../constants/routes';
import { CLUB_INFO } from '../constants/club';
import { Trophy, Eye, EyeOff } from 'lucide-react';

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  // Shows a "coming soon" toast when user tries to submit
  const [showToast, setShowToast] = useState(false);

  // In Phase 1: show a "backend coming soon" toast
  // In Phase 2: POST credentials to /api/auth/login
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
                Welcome Back
              </h1>
              <p className="text-text-secondary text-sm">
                Log in to {CLUB_INFO.shortName}
              </p>
            </div>

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-navy-primary">Email</label>
                <input
                  type="email"
                  required
                  placeholder="member@example.com"
                  className="w-full p-3 rounded-lg border border-border focus:ring-2 focus:ring-gold-primary outline-none text-sm bg-bg-subtle"
                />
              </div>

              {/* Password field with show/hide toggle */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-navy-primary">Password</label>
                  <a href="#" className="text-sm text-gold-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="w-full p-3 pr-10 rounded-lg border border-border focus:ring-2 focus:ring-gold-primary outline-none text-sm bg-bg-subtle"
                  />
                  {/* Show/hide password button */}
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
                Log In
              </Button>
            </form>

            {/* "Backend coming soon" notice — shown after submit in Phase 1 */}
            {showToast && (
              <div className="mt-5 bg-blue-50 text-blue-800 p-4 rounded-lg border border-blue-200 text-sm text-center font-medium">
                🚀 Authentication backend is coming in Phase 2. Stay tuned!
              </div>
            )}

            {/* Sign up link */}
            <div className="mt-8 pt-6 border-t border-border text-center text-sm text-text-secondary">
              Don't have an account?{' '}
              <Link to={ROUTES.REGISTER} className="text-gold-primary font-bold hover:underline">
                Sign up for free
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
