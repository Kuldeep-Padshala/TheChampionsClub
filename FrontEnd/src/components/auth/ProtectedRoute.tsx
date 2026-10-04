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
  const { user, isLoading, hasRole, login } = useAuth();
  const location = useLocation();
  const [isSwitching, setIsSwitching] = React.useState(false);

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
      const isMemberRequired = allowedRoles.includes('MEMBER');
      const isManagerRequired = allowedRoles.includes('MANAGER');
      const isBarRequired = allowedRoles.includes('BAR_STAFF');
      const isOwnerRequired = allowedRoles.includes('OWNER');
      const isShopRequired = allowedRoles.includes('SHOP_STAFF') || allowedRoles.includes('GEAR_BOX_STAFF');
      const isAccountantRequired = allowedRoles.includes('ACCOUNTANT');

      const title = isManagerRequired
        ? 'Executive Access Restricted'
        : isBarRequired
        ? 'Cafe & Bar Access Restricted'
        : isMemberRequired
        ? 'Member Access Required'
        : isOwnerRequired
        ? 'Owner Suite Access Restricted'
        : 'Staff Access Restricted';

      const roleText = isManagerRequired
        ? 'MANAGER'
        : isBarRequired
        ? 'BAR_STAFF'
        : isMemberRequired
        ? 'MEMBER'
        : isOwnerRequired
        ? 'OWNER'
        : 'STAFF';

      const demoAccount = isMemberRequired
        ? { email: 'ananya.singh@example.com', name: 'Ananya Singh (Member)', pass: 'Password@123' }
        : isManagerRequired
        ? { email: 'sunita.rao@championsclub.example', name: 'Sunita Rao (Manager)', pass: 'Password@123' }
        : isBarRequired
        ? { email: 'imran.shaikh@championsclub.example', name: 'Imran Shaikh (Bar & Cafe)', pass: 'Password@123' }
        : isOwnerRequired
        ? { email: 'rajesh.malhotra@championsclub.example', name: 'Rajesh Malhotra (Owner)', pass: 'Password@123' }
        : isShopRequired
        ? { email: 'neha.kulkarni@championsclub.example', name: 'Neha Kulkarni (Shop)', pass: 'Password@123' }
        : isAccountantRequired
        ? { email: 'meera.bhatt@bhattassociates.example', name: 'Meera Bhatt (Accountant)', pass: 'Password@123' }
        : { email: 'ananya.singh@example.com', name: 'Ananya Singh (Member)', pass: 'Password@123' };

      const handleQuickSwitch = async () => {
        setIsSwitching(true);
        try {
          await login(demoAccount.email, demoAccount.pass);
        } catch {
          // If login fails, redirect to login page
          window.location.href = ROUTES.LOGIN;
        } finally {
          setIsSwitching(false);
        }
      };

      const userDashboard = (() => {
        const roles = user.roles || [];
        if (roles.includes('OWNER')) return { path: ROUTES.OWNER, label: 'Go to Owner Executive Suite' };
        if (roles.includes('SYSTEM_ADMIN') || roles.includes('ADMIN')) return { path: ROUTES.ADMIN, label: 'Go to Admin Console' };
        if (roles.includes('MANAGER')) return { path: ROUTES.MANAGER, label: 'Go to Manager Console' };
        if (roles.includes('ACCOUNTANT')) return { path: ROUTES.ACCOUNTANT, label: 'Go to Finance & Accounting Console' };
        if (roles.includes('SHOP_STAFF') || roles.includes('GEAR_BOX_STAFF')) return { path: ROUTES.SHOP_STATION, label: 'Go to Pro Shop Station' };
        if (roles.includes('BAR_STAFF')) return { path: ROUTES.BAR, label: 'Go to Cafe & Bar Station' };
        if (roles.includes('FRONT_DESK')) return { path: ROUTES.RECEPTIONIST, label: 'Go to Front Desk Lead Station' };
        if (roles.includes('MEMBER')) return { path: ROUTES.MEMBER_PORTAL, label: 'Go to Member Sanctuary Portal' };
        return { path: ROUTES.HOME, label: 'Go to Club Home' };
      })();

      return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 pt-28 pb-16">
          <div className="max-w-md w-full p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#0A0A0D] border border-amber-500/20 dark:border-[#B89047]/30 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-[#B89047]/10 border border-[#B89047]/20 text-[#B89047] flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={28} />
            </div>
            <h2 className="font-display text-2xl font-bold text-[#1D1D1F] dark:text-white mb-2">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Your current account (<span className="text-[#1D1D1F] dark:text-gray-200 font-semibold">{user.email}</span>) does not have the required <strong>{roleText}</strong> role.
            </p>
            <div className="flex flex-col gap-3">
              {/* 1-Click Fast Switch to Authorized Demo Account */}
              <button
                type="button"
                onClick={handleQuickSwitch}
                disabled={isSwitching}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-[#EAD29A] to-[#B89047] hover:brightness-105 text-black shadow-md cursor-pointer transition-all active:scale-98 disabled:opacity-50"
              >
                <LogIn size={15} />
                <span>{isSwitching ? 'Switching Session...' : `⚡ 1-Click Switch to ${demoAccount.name}`}</span>
              </button>

              {/* Navigate to current station */}
              <Link
                to={userDashboard.path}
                className="w-full h-10 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors border border-black/10 dark:border-white/10"
              >
                <span>{userDashboard.label}</span>
              </Link>

              {/* Login with different account */}
              <Link
                to={ROUTES.LOGIN}
                className="w-full h-9 flex items-center justify-center gap-2 rounded-xl text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <span>Sign in with different credentials</span>
              </Link>

              {/* Return to club home */}
              <Link
                to={ROUTES.HOME}
                className="w-full h-8 flex items-center justify-center gap-2 rounded-xl text-xs font-medium text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={13} />
                <span>Return to Club Home</span>
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
