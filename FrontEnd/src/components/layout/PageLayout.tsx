import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AmbientBackground } from './AmbientBackground';
import { ROUTES } from '../../constants/routes';

interface PageLayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
  hideFooter?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ children, hideNav, hideFooter }) => {
  const location = useLocation();
  const isStaffRoute = location.pathname.startsWith(ROUTES.RECEPTIONIST);

  const shouldHideNav = hideNav || isStaffRoute;
  const shouldHideFooter = hideFooter || isStaffRoute;

  return (
    <div className="flex min-h-screen flex-col bg-transparent relative">
      <AmbientBackground />
      {!shouldHideNav && <Navbar />}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 w-full"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      {!shouldHideFooter && <Footer />}
    </div>
  );
};

export default PageLayout;
