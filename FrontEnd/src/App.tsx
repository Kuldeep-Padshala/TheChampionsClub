import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ROUTES } from './constants/routes';
import { HomePage } from './pages/HomePage';
import { CourtsPage } from './pages/CourtsPage';
import { CafePage } from './pages/CafePage';
import { ShopPage } from './pages/ShopPage';
import { MembershipsPage } from './pages/MembershipsPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ReceptionistPage } from './pages/ReceptionistPage';
import { MemberPortalPage } from './pages/MemberPortalPage';
import { ManagerPage } from './pages/ManagerPage';
import { BarStaffPage } from './pages/BarStaffPage';
import { ShopStaffPage } from './pages/ShopStaffPage';
import { AccountantPage } from './pages/AccountantPage';
import { AdminPage } from './pages/AdminPage';
import { OwnerPage } from './pages/OwnerPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPromptModal } from './components/common/LoginPromptModal';
import { ScrollToTop } from './components/common/ScrollToTop';
import { SmoothScroll } from './components/common/SmoothScroll';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { AmbientBackground } from './components/layout/AmbientBackground';

function AnimatedRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<HomePage />} />
      <Route path={ROUTES.COURTS} element={<CourtsPage />} />
      <Route path={ROUTES.CAFE} element={<CafePage />} />
      <Route path={ROUTES.SHOP} element={<ShopPage />} />
      <Route path={ROUTES.MEMBERSHIPS} element={<MembershipsPage />} />
      <Route path={ROUTES.ABOUT} element={<AboutPage />} />
      <Route path={ROUTES.CONTACT} element={<ContactPage />} />
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
      <Route
        path={ROUTES.RECEPTIONIST}
        element={
          <ProtectedRoute allowedRoles={['FRONT_DESK']}>
            <ReceptionistPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.MEMBER_PORTAL}
        element={
          <ProtectedRoute allowedRoles={['MEMBER']}>
            <MemberPortalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.MANAGER}
        element={
          <ProtectedRoute allowedRoles={['MANAGER', 'OWNER']}>
            <ManagerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.BAR}
        element={
          <ProtectedRoute allowedRoles={['BAR_STAFF', 'MANAGER', 'OWNER']}>
            <BarStaffPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.SHOP_STATION}
        element={
          <ProtectedRoute allowedRoles={['SHOP_STAFF', 'GEAR_BOX_STAFF', 'MANAGER', 'OWNER']}>
            <ShopStaffPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ACCOUNTANT}
        element={
          <ProtectedRoute allowedRoles={['ACCOUNTANT', 'MANAGER', 'OWNER']}>
            <AccountantPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN}
        element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN']}>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.OWNER}
        element={
          <ProtectedRoute allowedRoles={['OWNER']}>
            <OwnerPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <SmoothScroll />
          <ScrollToTop />
          <AmbientBackground />
          <Navbar />
          <AnimatedRoutes />
          <LoginPromptModal />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#121216',
                color: '#FAF8F5',
                border: '1px solid rgba(184, 144, 71, 0.35)',
                fontSize: '13px',
                borderRadius: '14px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
                fontFamily: 'inherit',
              },
              success: {
                iconTheme: {
                  primary: '#B89047',
                  secondary: '#121216',
                },
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
