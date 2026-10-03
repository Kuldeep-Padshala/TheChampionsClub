import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { LoginPromptModal } from './components/common/LoginPromptModal';

function App() {
  return (
    <BrowserRouter>
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
      </Routes>
      <LoginPromptModal />
    </BrowserRouter>
  );
}

export default App;

