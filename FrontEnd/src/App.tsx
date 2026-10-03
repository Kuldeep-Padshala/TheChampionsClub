import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { LoginPromptModal } from './components/common/LoginPromptModal';
import { ScrollToTop } from './components/common/ScrollToTop';
import { SmoothScroll } from './components/common/SmoothScroll';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <SmoothScroll />
          <ScrollToTop />
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
            <Route path={ROUTES.RECEPTIONIST} element={<ReceptionistPage />} />
          </Routes>
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
