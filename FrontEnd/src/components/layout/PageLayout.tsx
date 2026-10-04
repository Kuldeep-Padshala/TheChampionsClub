import React from 'react';
import { useLocation } from 'react-router-dom';
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
      <main className="flex-1 w-full">
        {children}
      </main>
      {!shouldHideFooter && <Footer />}
    </div>
  );
};

export default PageLayout;
