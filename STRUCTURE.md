# 📁 The Champions Club — Full-Stack Repository Structure Guide

> **The Champions Club** — Private Luxury Sports & Athletic Sanctuary  
> **Status:** Phase 1 (Public Sanctuary Experience) & Phase 2 (Live Cloud Authentication) Complete  
> **Frontend Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Framer Motion + Axios + Lucide  
> **Backend Stack:** Node.js + Express + TypeScript + Argon2id + JWT + Aiven MySQL Cloud (SSL)  

---

## ⚡ Quick Reference: "Where do I find / change X?"

| I want to change…                               | Go to this file                                                              |
|-------------------------------------------------|------------------------------------------------------------------------------|
| Club name, address, phone, email, socials       | `FrontEnd/src/constants/club.ts`                                             |
| Page routes (URLs)                              | `FrontEnd/src/constants/routes.ts`                                           |
| Theme system (Pure Obsidian #000 & Day Mode)    | `FrontEnd/src/context/ThemeContext.tsx` + `FrontEnd/src/index.css`           |
| Global authentication state (`user`, `login`)  | `FrontEnd/src/context/AuthContext.tsx`                                       |
| API client & automatic 401 token refresh        | `FrontEnd/src/api/client.ts`                                                 |
| Frontend API URL configuration                  | `FrontEnd/.env` (`VITE_API_URL`)                                             |
| Cloud Database credentials & connection         | `Backend/.env` + `Backend/src/config/db.ts` (Aiven MySQL)                     |
| Navbar (floating capsule, links, auth pill)     | `FrontEnd/src/components/layout/Navbar.tsx`                                   |
| Footer (brand, contact, hours, links)           | `FrontEnd/src/components/layout/Footer.tsx`                                   |
| Login page & Google OAuth button                | `FrontEnd/src/pages/LoginPage.tsx` + `src/components/auth/GoogleButton.tsx`   |
| Registration page & strength indicator          | `FrontEnd/src/pages/RegisterPage.tsx` + `PasswordStrength.tsx`                |
| 2-Step OTP Password Reset                       | `FrontEnd/src/pages/ForgotPasswordPage.tsx`                                   |
| Smooth scrolling (Lenis 60fps)                  | `FrontEnd/src/components/common/SmoothScroll.tsx`                             |
| Ambient luxury glowing orbs                     | `FrontEnd/src/components/layout/AmbientBackground.tsx`                        |
| Hero banner, magnetic CTAs & homepage showcase  | `FrontEnd/src/pages/HomePage.tsx`                                             |
| Courts information & pricing                    | `FrontEnd/src/data/courts.json`                                               |
| Court slot availability                         | `FrontEnd/src/data/slots.json` + `src/components/courts/SlotCalendar.tsx`     |
| Pro Shop products & categories                  | `FrontEnd/src/data/shop.json` + `src/pages/ShopPage.tsx`                      |
| Cafe & Lounge menu items                        | `FrontEnd/src/data/menu.json` + `src/pages/CafePage.tsx`                      |
| Membership plans & comparison table             | `FrontEnd/src/data/memberships.json` + `src/pages/MembershipsPage.tsx`        |
| Front Desk & Concierge Portal (`/frontdesk`)    | `FrontEnd/src/pages/ReceptionistPage.tsx`                                    |
| Front Desk API Client & Services                | `FrontEnd/src/services/receptionistService.ts`                               |
| Front Desk TypeScript Interfaces                | `FrontEnd/src/types/receptionist.types.ts`                                   |
| Receptionist Backend Controller                 | `Backend/src/controllers/receptionist.controller.ts`                         |
| Receptionist Backend Routes                     | `Backend/src/routes/receptionist.routes.ts`                                  |
| Photo gallery                                   | `FrontEnd/src/data/gallery.json`                                              |
| Opening hours schedule                          | `FrontEnd/src/pages/HomePage.tsx` → `hours` array                             |

---

## 📂 Complete Full-Stack Repository Structure

```
TheChampionsClub/
│
├── Backend/                                  ✅ BACKEND API SERVER (Node.js + Express + TypeScript)
│   ├── .env                                  Environment variables (Aiven DB, JWT secrets, ports)
│   ├── tsconfig.json                         TypeScript configuration
│   ├── package.json                          Dependencies (express, mysql2, argon2, jsonwebtoken, etc.)
│   └── src/
│       ├── app.ts                            Express app entrypoint, CORS, security & route registration
│       ├── config/
│       │   ├── db.ts                         Aiven MySQL connection pool with SSL/TLS configuration
│       │   └── env.ts                        Type-safe environment variable parser & defaults
│       ├── controllers/
│       │   ├── auth.controller.ts            Auth endpoints (register, login, me, refresh, logout, reset)
│       │   └── receptionist.controller.ts    Front desk: Members, check-in, court calendar, POS & enquiries
│       ├── middleware/
│       │   ├── auth.middleware.ts            JWT verification & requireRole('FRONT_DESK') middleware
│       │   ├── rateLimiter.ts                Sliding-window IP rate limiter
│       │   └── validate.ts                   Input validation middleware
│       ├── routes/
│       │   ├── auth.routes.ts                Express router mapping /api/auth/* routes
│       │   └── receptionist.routes.ts        Front desk concierge router mapping /api/receptionist/*
│       ├── services/
│       │   ├── auth.service.ts               User creation, argon2 hashing, credential verification, OTP
│       │   ├── token.service.ts              Access & Refresh JWT generation, hashing, and rotation
│       │   └── email.service.ts              Gmail delivery & console OTP fallback logger
│       ├── templates/                        HTML email templates (welcomeEmail.ts, otpEmail.ts)
│       └── types/
│           └── index.ts                      Backend TypeScript types & JWT payload definitions
│
├── FrontEnd/                                 ✅ FRONTEND APPLICATION (React 18 + Vite + TypeScript)
│   ├── .env                                  Frontend environment configuration (VITE_API_URL)
│   ├── index.html                            Vite HTML root with Google Fonts (Cinzel, Plus Jakarta Sans)
│   ├── vite.config.ts                        Vite configuration
│   ├── tsconfig.json                         TypeScript configuration
│   ├── package.json                          Dependencies (react, tailwindcss, lucide-react, framer-motion, axios, react-hot-toast)
│   ├── STRUCTURE.md                          📖 Architecture & folder guide
│   └── src/
│       ├── api/                              ✅ API CLIENT LAYER
│       │   └── client.ts                     Axios instance (withCredentials: true, auto 401 token refresh)
│       │
│       ├── context/                          ✅ GLOBAL REACT CONTEXTS
│       │   ├── AuthContext.tsx               User session, login, register, logout, refreshUser
│       │   └── ThemeContext.tsx              Luxury dual-theme: Pure Obsidian Night (#000) & Champagne Pearl
│       │
│       ├── components/                       ✅ REUSABLE UI & DOMAIN COMPONENTS
│       │   │
│       │   ├── layout/                       App layout shells & background
│       │   │   ├── Navbar.tsx                Floating glass capsule nav (responsive, dynamic member pill)
│       │   │   ├── Footer.tsx                Bottom luxury footer (columns, socials, operating hours)
│       │   │   ├── PageLayout.tsx            Unified page wrapper with route transitions
│       │   │   └── AmbientBackground.tsx     Hardware-accelerated ambient glowing background orbs
│       │   │
│       │   ├── auth/                         Authentication components
│       │   │   ├── GoogleButton.tsx          Bespoke Google OAuth button (dual-theme styling)
│       │   │   ├── PasswordInput.tsx         Floating eye toggle & gold focus ring
│       │   │   ├── PasswordStrength.tsx      Live 4-tier tour-grade password strength meter
│       │   │   └── ProtectedRoute.tsx        Route guard for member-only pages
│       │   │
│       │   ├── ui/                           Luxury primitive components
│       │   │   ├── Button.tsx                Primary, secondary, outline, ghost luxury buttons
│       │   │   ├── MagneticButton.tsx        Physics-based magnetic hover buttons
│       │   │   ├── SpotlightCard.tsx         Radial mouse-following gold spotlight cards
│       │   │   ├── ScrollExpand.tsx          Cinematic Apple-style scroll expanding showcase
│       │   │   ├── MaskedHeading.tsx         Metallic text gradient headings
│       │   │   ├── Badge.tsx                 Status, sport type, and tier badges
│       │   │   ├── Card.tsx                  Base card container
│       │   │   ├── Modal.tsx                 Backdrop modal with escape key support
│       │   │   └── SectionHeader.tsx         Consistent section title & subtitle block
│       │   │
│       │   ├── courts/                       Court booking components
│       │   │   ├── CourtCard.tsx             Court card with surface badges, amenities, pricing
│       │   │   └── SlotCalendar.tsx          7-day interactive time-slot booking grid
│       │   │
│       │   ├── shop/                         Pro Shop components
│       │   │   ├── ProductCard.tsx           Product card with pricing, stock status, cart action
│       │   │   └── CategoryFilter.tsx        Category & sport pill filters
│       │   │
│       │   ├── cafe/                         Clubhouse Lounge & Cafe components
│       │   │   ├── MenuCard.tsx              Menu item with dietary tags and pricing
│       │   │   └── MenuCategoryTabs.tsx      Food / Drinks / Bar category switcher
│       │   │
│       │   ├── membership/                   Membership tier components
│       │   │   └── MembershipCard.tsx        Tier cards (Gold, Silver, Junior, Trial)
│       │   │
│       │   └── common/                       Common utility components
│       │       ├── LoginPromptModal.tsx      "Login required" modal prompt
│       │       ├── SmoothScroll.tsx          Lenis smooth momentum scrolling provider
│       │       └── ScrollToTop.tsx           Auto-scroll to top on route navigation
│       │
│       ├── pages/                            ✅ PAGE ROUTE VIEWS
│       │   ├── HomePage.tsx                  Hero, features, center arena showcase, member CTA banner
│       │   ├── CourtsPage.tsx                Court catalog & weekly time slot booking
│       │   ├── CafePage.tsx                  Clubhouse Cafe & Lounge menu catalog
│       │   ├── ShopPage.tsx                  Pro Shop gear & racquet equipment catalog
│       │   ├── MembershipsPage.tsx           Tier benefits, comparison table & FAQ
│       │   ├── AboutPage.tsx                 Club heritage, philosophy, facilities & coaching staff
│       │   ├── ContactPage.tsx               Concierge contact form, operating hours & location map
│       │   ├── LoginPage.tsx                 Member login (email/password & Google OAuth)
│       │   ├── RegisterPage.tsx              Account creation with live password strength meter
│       │   ├── ForgotPasswordPage.tsx        2-Step OTP cryptographic password reset
│       │   └── ReceptionistPage.tsx          Front Desk & Concierge Portal (7 integrated staff modules)
│       │
│       ├── constants/                        ✅ STATIC CONFIGURATION
│       │   ├── club.ts                       Club branding, address, phone, email, operating hours
│       │   └── routes.ts                     Client route constants (HOME, COURTS, LOGIN, RECEPTIONIST)
│       │
│       ├── types/                            ✅ SHARED TYPESCRIPT TYPES
│       │   ├── court.types.ts                Court, TimeSlot, Booking interfaces
│       │   ├── menu.types.ts                 MenuItem, MenuCategory interfaces
│       │   ├── shop.types.ts                 Product, ProductCategory, CartItem interfaces
│       │   ├── membership.types.ts           MembershipPlan, Benefit interfaces
│       │   ├── receptionist.types.ts         Member, Court, Invoice, Enquiry, CheckIn interfaces
│       │   └── user.types.ts                 User profile and auth session interfaces
│       │
│       ├── services/                         ✅ DATA & API SERVICES
│       │   ├── courtsService.ts              getCourts(), getSlotsForWeek()
│       │   ├── menuService.ts                getMenuItems()
│       │   ├── shopService.ts                getProducts()
│       │   ├── membershipService.ts          getPlans()
│       │   └── receptionistService.ts        Receptionist API client (checkin, bookings, POS, leads)
│       │
│       ├── data/                             ✅ LOCAL DATASETS (Mock / Fallback)
│       │   ├── courts.json                   Court definitions & features
│       │   ├── slots.json                    Weekly schedule slots
│       │   ├── menu.json                     Cafe food, drinks & bar menus
│       │   ├── shop.json                     Equipment & apparel catalog
│       │   ├── memberships.json              Tier prices & privileges
│       │   └── gallery.json                  High-resolution photo gallery
│       │
│       ├── utils/                            ✅ UTILITY FUNCTIONS
│       │   ├── cn.ts                         clsx + tailwind-merge class aggregator
│       │   ├── dateUtils.ts                  Date formatting and calendar helpers
│       │   └── priceUtils.ts                 Currency formatting (₹ INR)
│       │
│       ├── App.tsx                           Root component: Providers + React Router + Toaster
│       ├── main.tsx                          React DOM entrypoint
│       └── index.css                         Tailwind base, luxury variables & typography
```

---

## 🗄️ Aiven Cloud Database Schema

The backend connects directly to the **Aiven Cloud MySQL Database** (`defaultdb` on port `21561` with TLS/SSL):

1. **`users` Table (Canonical Authentication & Staff/Member Store):**
   - `id` (BIGINT AUTO_INCREMENT PRIMARY KEY)
   - `full_name` (VARCHAR)
   - `email` (VARCHAR UNIQUE)
   - `phone` (VARCHAR UNIQUE)
   - `password_hash` (VARCHAR — bcrypt)
   - `status` (VARCHAR — `active`, `suspended`, `disabled`)
   - `must_change_password` (TINYINT)
   - `failed_login_count` (SMALLINT)
   - `locked_until` (DATETIME)
   - `last_login_at` (DATETIME)
   - `email_verified_at`, `phone_verified_at` (DATETIME)
   - `created_at`, `updated_at` (DATETIME)

2. **`user_roles` & `roles` Tables (Role-Based Access Control):**
   - `user_roles.user_id` (BIGINT) → `users.id`
   - `user_roles.role_id` (BIGINT) → `roles.id`
   - Role codes: `OWNER` (1), `MANAGER` (2), `FRONT_DESK` (3), `BAR_STAFF` (4), `SHOP_STAFF` (5), `COACH` (6), `ACCOUNTANT` (7), `MEMBER` (8)

3. **`refresh_tokens` Table:**
   - `id` (VARCHAR(36) PRIMARY KEY)
   - `user_id` (BIGINT)
   - `token_hash` (VARCHAR)
   - `expires_at` (DATETIME)
   - `created_at` (DATETIME)

4. **`password_reset_otps` Table:**
   - `id` (VARCHAR(36) PRIMARY KEY)
   - `user_id` (BIGINT)
   - `otp_hash` (VARCHAR)
   - `expires_at` (DATETIME)
   - `attempts` (TINYINT)
   - `used` (TINYINT)
   - `created_at` (DATETIME)

---

## 🔐 Authentication & Session Flow

```
[ Browser / Client ]                                   [ Express Backend ]                   [ Aiven MySQL ]
       │                                                        │                                   │
       ├─── POST /api/auth/login (email, password) ────────────►│                                   │
       │                                                        ├─── Query user by email ──────────►│
       │                                                        │◄── Return user & hash ────────────┤
       │                                                        ├─── Verify argon2id hash           │
       │                                                        ├─── Store refresh token hash ─────►│
       │◄── HTTP-only Cookies (__access_token, __refresh_token) ┤                                   │
       │                                                        │                                   │
       ├─── Subsequent Requests (Credentials: Include) ────────►│                                   │
       │                                                        ├─── Verify JWT in Cookie           │
       │◄── 200 OK Protected Response ──────────────────────────┤                                   │
       │                                                        │                                   │
       ├─── If Access Token Expired (401)                       │                                   │
       │    └── Axios Interceptor calls /api/auth/refresh ─────►│                                   │
       │                                                        ├─── Rotate tokens in DB ──────────►│
       │◄────── New token cookies issued automatically ─────────┤                                   │
```

---

## 🗺️ Project Roadmap Status

| Phase | Milestone | Status | Key Features |
|-------|-----------|--------|--------------|
| **Phase 1** | **Public Sanctuary Experience** | ✅ Complete | World-class responsive UI, Courts, Pro Shop, Cafe, Memberships, Sanctuary Story, Lenis Smooth Scroll, Luxury Dual Theme (Obsidian #000 & Day) |
| **Phase 2** | **Production Cloud Authentication** | ✅ Complete | Aiven MySQL Cloud DB, Argon2id encryption, Dual JWT HTTP-only cookies, Silent 401 token refresh, 2-Step OTP Password Reset, Google OAuth, Navbar member avatar & Sign In state |
| **Phase 3** | **Interactive Court Booking** | 🚀 Next | Live slot reservations directly into database, conflict detection, booking history |
| **Phase 4** | **Pro Shop Cart & Orders** | 📅 Upcoming | In-memory cart, Stripe/Razorpay payment gateway, order tracking |
| **Phase 5** | **Receptionist & Concierge Portal** | ✅ Complete | Staff role-based routing (`/frontdesk`), QR/Barcode & manual check-in, alert blocks for expired/unpaid, daily court timeline grid booking, member directory & plan assignment, POS unpaid billing & receipt, lead enquiry tracker & follow-up |
| **Phase 6** | **Executive Management Dashboard** | 📅 Upcoming | Revenue metrics, court utilization heatmaps, member lifetime value |
