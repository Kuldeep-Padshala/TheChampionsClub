import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Footer } from './Footer';
import { ROUTES } from '../../constants/routes';

interface PageLayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
  hideFooter?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ children, hideFooter }) => {
  const location = useLocation();
  const isStaffRoute = location.pathname.startsWith(ROUTES.RECEPTIONIST);
  const shouldHideFooter = hideFooter || isStaffRoute;

  return (
    <div className="flex min-h-screen flex-col bg-transparent relative">
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 w-full"
      >
        {children}
      </motion.main>
      {!shouldHideFooter && <Footer />}
    </div>
  );
};

export default PageLayout;
