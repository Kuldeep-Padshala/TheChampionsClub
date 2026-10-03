# 📁 Sports Club — Project Structure Guide

> **The Champions Club** — Sports Management System  
> Phase 1: Public Mode | Stack: React 18 + Vite + TypeScript + Tailwind CSS

---

## ⚡ Quick: "Where do I find / change X?"

| I want to change…                          | Go to this file                                              |
|--------------------------------------------|--------------------------------------------------------------|
| Club name, address, phone, email           | `src/constants/club.ts`                                      |
| Page routes (URLs)                         | `src/constants/routes.ts`                                    |
| Brand colors / theme tokens                | `src/index.css` → `@theme { }` block                        |
| Navbar links                               | `src/components/layout/Navbar.tsx` → `NAV_LINKS` array      |
| Footer content                             | `src/components/layout/Footer.tsx`                           |
| Hero banner text + images                  | `src/pages/HomePage.tsx` → Section 1                        |
| Courts info + pricing                      | `src/data/courts.json`                                       |
| Court slot availability (mock)             | `src/data/slots.json`                                        |
| Slot calendar UI                           | `src/components/courts/SlotCalendar.tsx`                     |
| Shop products                              | `src/data/shop.json`                                         |
| Shop category filter options               | `src/pages/ShopPage.tsx` → `CATEGORIES` and `SPORTS` arrays |
| Cafe / Bar menu items                      | `src/data/menu.json`                                         |
| Membership plans + benefits                | `src/data/memberships.json`                                  |
| Membership comparison table rows          | `src/pages/MembershipsPage.tsx` → `comparisonRows` array    |
| Gallery photos                             | `src/data/gallery.json`                                      |
| "Login to continue" modal                  | `src/components/common/LoginPromptModal.tsx`                 |
| Opening hours table (Home page)            | `src/pages/HomePage.tsx` → `hours` array                    |
| Contact form fields                        | `src/pages/ContactPage.tsx`                                  |
| FAQ questions (Memberships page)           | `src/pages/MembershipsPage.tsx` → `faqs` array              |
| Replace mock data with real API calls      | `src/services/*.ts` → uncomment fetch() lines               |
| Global auth state                          | `src/store/authStore.ts`                                     |
| Login modal trigger logic                  | `src/store/uiStore.ts` + `src/hooks/useLoginPrompt.ts`      |

---

## 📂 Full Folder Structure

```
sports-club/
│
├── public/                       Static assets (favicon, images)
│
├── src/
│   │
│   ├── assets/                   Images and icons used in JSX components
│   │
│   ├── components/               ✅ REUSABLE UI COMPONENTS
│   │   │                         (Used across multiple pages — do NOT put page logic here)
│   │   │
│   │   ├── layout/               App shell — wraps every page
│   │   │   ├── Navbar.tsx        Top navigation (logo, links, mobile drawer)
│   │   │   ├── Footer.tsx        Bottom footer (links, contact, hours)
│   │   │   └── PageLayout.tsx    Wraps every page: <Navbar> + <main> + <Footer>
│   │   │
│   │   ├── ui/                   Generic primitive components
│   │   │   ├── Button.tsx        Primary, secondary, outline, ghost variants
│   │   │   ├── Badge.tsx         Sport type, stock, plan labels
│   │   │   ├── Card.tsx          Base card + CardContent padding wrapper
│   │   │   ├── Modal.tsx         Overlay modal (backdrop click, Escape key)
│   │   │   └── SectionHeader.tsx Consistent section title + subtitle
│   │   │
│   │   ├── courts/               Court-specific components
│   │   │   ├── CourtCard.tsx     Single court card (image, amenities, pricing, CTA)
│   │   │   └── SlotCalendar.tsx  7-day weekly slot grid (available/booked/social)
│   │   │
│   │   ├── shop/                 Shop-specific components
│   │   │   ├── ProductCard.tsx   Single product (image, price, stock, Add to Cart)
│   │   │   └── CategoryFilter.tsx Horizontal pill category filter bar
│   │   │
│   │   ├── cafe/                 Cafe & Bar components
│   │   │   ├── MenuCard.tsx      Single menu item (veg indicator, price, Order)
│   │   │   └── MenuCategoryTabs.tsx Food / Drinks / Bar tab switcher
│   │   │
│   │   ├── membership/           Membership plan components
│   │   │   └── MembershipCard.tsx Gold / Silver / Junior plan card
│   │   │
│   │   └── common/               Shared domain-specific components
│   │       └── LoginPromptModal.tsx "Login to continue" modal (core Phase 1 feature)
│   │
│   ├── pages/                    ✅ PAGE-LEVEL COMPONENTS (one per URL route)
│   │   ├── HomePage.tsx          Landing: hero, stats, features, courts, plans, gallery, hours, map
│   │   ├── CourtsPage.tsx        Courts grid + court selector + weekly slot calendar
│   │   ├── CafePage.tsx          Cafe & Bar: tab switcher + menu grid + info cards
│   │   ├── ShopPage.tsx          Gear shop: filters + product grid
│   │   ├── MembershipsPage.tsx   Plan cards + comparison table + FAQ accordion
│   │   ├── AboutPage.tsx         Club story + facilities + gallery + team
│   │   ├── ContactPage.tsx       Contact info + enquiry form + map
│   │   ├── LoginPage.tsx         Login form (scaffolded — Phase 2)
│   │   └── RegisterPage.tsx      Register form (scaffolded — Phase 2)
│   │
│   ├── data/                     ✅ MOCK DATA (JSON files)
│   │   │                         Phase 2: delete these, replace with API calls in services/
│   │   ├── courts.json           Court details (name, sport, image, amenities, pricing)
│   │   ├── slots.json            Time slot availability for all courts × 7 days
│   │   ├── menu.json             Food, drinks, bar items with prices
│   │   ├── shop.json             Products with category, sport, price, stock
│   │   ├── memberships.json      Gold / Silver / Junior plan data
│   │   └── gallery.json          Club photo gallery items
│   │
│   ├── services/                 ✅ API SERVICE LAYER (backend-ready)
│   │   │                         Phase 1: reads from /data/*.json
│   │   │                         Phase 2: replace body with fetch('/api/...')
│   │   ├── courtsService.ts      getCourts(), getSlotsForWeek()
│   │   ├── menuService.ts        getMenuItems()
│   │   ├── shopService.ts        getProducts()
│   │   └── membershipService.ts  getPlans()
│   │
│   ├── hooks/                    ✅ CUSTOM REACT HOOKS
│   │   ├── useAuth.ts            Returns { isLoggedIn, user } — false in Phase 1
│   │   └── useLoginPrompt.ts     requireLogin(action) + closeLoginModal()
│   │
│   ├── store/                    ✅ ZUSTAND GLOBAL STATE
│   │   ├── authStore.ts          isLoggedIn, user, login(), logout()
│   │   └── uiStore.ts            loginModal open/close + action text
│   │
│   ├── types/                    ✅ TYPESCRIPT TYPE DEFINITIONS
│   │   ├── court.types.ts        Court, TimeSlot, Booking interfaces
│   │   ├── menu.types.ts         MenuItem, MenuCategory
│   │   ├── shop.types.ts         Product, ProductCategory, CartItem
│   │   ├── membership.types.ts   MembershipPlan, Benefit
│   │   └── user.types.ts         User, AuthState
│   │
│   ├── constants/                ✅ APP-WIDE CONSTANTS
│   │   ├── routes.ts             ROUTES.HOME, ROUTES.COURTS, etc.
│   │   └── club.ts               CLUB_INFO: name, address, phone, hours
│   │
│   ├── utils/                    ✅ HELPER / UTILITY FUNCTIONS
│   │   ├── dateUtils.ts          generateWeekDays(), formatDate()
│   │   ├── priceUtils.ts         formatPrice() → "₹1,500"
│   │   └── cn.ts                 Tailwind class merge utility
│   │
│   ├── App.tsx                   Root: BrowserRouter + all Routes
│   ├── main.tsx                  Vite entry point
│   └── index.css                 Tailwind + luxury light theme tokens
│
├── index.html                    Vite HTML — Google Fonts loaded here
├── vite.config.ts                Vite build configuration
├── tsconfig.json                 TypeScript configuration
├── package.json                  Dependencies
└── STRUCTURE.md                  📖 This file — folder guide & quick reference
```

---

## 🔄 Adding Phase 2 (Real Backend)

To switch from mock data to real API endpoints, you only need to edit `src/services/*.ts`.

**Example — switching courts from mock to real API:**

```ts
// src/services/courtsService.ts

// ── BEFORE (Phase 1: mock data) ──
import courtsData from '../data/courts.json';
export const getCourts = async () => Promise.resolve(courtsData);

// ── AFTER (Phase 2: real API) ──
export const getCourts = async () => {
  const res = await fetch('/api/courts');
  if (!res.ok) throw new Error('Failed to fetch courts');
  return res.json();
};
```

Zero changes needed in pages or components — they just call `getCourts()`.

---

## 🗺️ Phase Roadmap

| Phase | What gets added |
|-------|----------------|
| **Phase 1** ✅ | Public Mode — browse everything, no login needed |
| **Phase 2** | Member Login — real auth, actual booking, shop orders, bar tabs |
| **Phase 3** | Staff Mode — front desk check-in, POS system |
| **Phase 4** | Admin / Owner — dashboard, revenue, inventory, payroll |
| **Phase 5** | Backend — Node.js + Express + PostgreSQL APIs |
