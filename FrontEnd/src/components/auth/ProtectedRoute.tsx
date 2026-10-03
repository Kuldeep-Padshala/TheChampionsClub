import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const { user, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#B89047]/30 border-t-[#B89047] rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-widest text-[#B89047] font-semibold">
            Authenticating Session...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const isAuthorized = allowedRoles.some((r) => hasRole(r));
    if (!isAuthorized) {
      return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 pt-28 pb-16">
          <div className="max-w-md w-full p-8 sm:p-10 rounded-3xl bg-white/80 dark:bg-[#0A0A0D]/90 backdrop-blur-2xl border border-red-500/20 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={28} />
            </div>
            <h2 className="font-display text-2xl font-bold text-[#1D1D1F] dark:text-white mb-2">
              Staff Access Restricted
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Your current account (<span className="text-[#1D1D1F] dark:text-gray-200 font-medium">{user.email}</span>) does not have the required <strong>FRONT_DESK</strong> or managerial role.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to={ROUTES.LOGIN}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold bg-[#121214] text-white hover:bg-[#B89047] dark:bg-[#B89047] dark:hover:bg-[#A67C38] dark:text-black transition-colors"
              >
                <LogIn size={15} />
                <span>Switch to Front Desk Account</span>
              </Link>
              <Link
                to={ROUTES.HOME}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Return to Sanctuary</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
