# 🏆 The Champions Club — Sports Club Management System
> **Building the digital backbone of a modern sports sanctuary that has outgrown WhatsApp and Excel.**

[![Node.js](https://img.shields.io/badge/Backend-Node.js%20v22-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Framework-Express%20v5-blue.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178c6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38bdf8.svg)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/Database-Aiven%20MySQL%20Cloud-00758f.svg)](https://aiven.io/)
[![Tests](https://img.shields.io/badge/Test%20Suite-20%2F20%20Passing%20(100%25)-brightgreen.svg)]()

---

## 📌 Executive Summary & Problem Statement

**The Champions Club** is a premier athletic and racquet club featuring tennis, cricket, badminton, and multi-sport facilities, a professional gear shop, an artisanal clubhouse cafe & bar, and a rapidly expanding community across three membership tiers: **Gold**, **Silver**, and **Junior**.

### The Problem: Before The Digital Backbone
Like many thriving sports clubs, operations had outgrown manual tools:
- 📱 **Court bookings:** Juggled over WhatsApp chats, resulting in double-bookings and missed slots.
- 📋 **Member records:** Fragmented across static Excel spreadsheets with zero expiry alerts.
- 🧾 **Cafe & Bar receipts:** Hand-written paper slips, lost bar tabs, and kitchen confusion during post-match rushes.
- 📞 **Availability inquiries:** Frustrated members making endless phone calls to check open courts.
- 📉 **Financial blindspot:** Cash, card, and UPI payments scattered across silos, leaving ownership with zero real-time visibility into revenue, dues, and profitability.

### The Solution: One Unified Operating System
**The Champions Club Management System** replaces WhatsApp, spreadsheets, and paper slips with a single, end-to-end cloud platform. It integrates a public luxury portal with dedicated role-based consoles for Members, Front Desk, Operations Managers, F&B Staff, Pro Shop, Accountants, and Executive Owners.

---

## 🗓️ How the System Solves "A Week at the Club"

| Scenario (From Problem Statement) | Operational Challenge | The Champions Club Solution |
|---|---|---|
| **1. A new member walks in** | Immediate identification, plan entitlement tracking, and preventing forgotten expiries. | **Digital Onboarding & QR Pass**: Instant front-desk check-in, auto-generated digital pass with QR code, automatic 1-year welcome tier provisioning, and automated expiry tracking with renewal notifications. |
| **2. Booking a court on a busy evening** | 6 PM rush, overlapping booking requests, 2-booking daily limits, tiered pricing (Gold = free). | **Zero-Conflict Court Engine**: 30-minute rolling slots, concurrency lock preventing double-bookings, strict 2-session daily quota enforcement, and automated tier pricing (Gold 100% waived, Silver discounted, walk-in standard). Supports Friday night social play. |
| **3. Gearing up before a match** | Emergency purchases, sofa orders, counter purchases, low-stock warnings. | **Unified Single-Pool Inventory**: Single inventory ledger shared between front-counter POS and online member orders. Real-time stock movement tracking, automated low-stock warnings, and VIP locker/counter fulfillment options. |
| **4. After the match, at the bar** | 20 people arriving at once, paperless orders, table tabs, automatic member discounts. | **Paperless Bar POS & Kitchen Display System (KDS)**: Table tracking, open tabs with running balances, automated tier discounts (10% Silver, 15% Gold), split payments (Cash, Card, UPI), and 1-click end-of-day reconciliation. |
| **5. A stranger finds the club online** | No website, inquiries vanish, lost prospective members. | **Public Luxury Sanctuary & CRM Lead Pipeline**: High-converting web portal with live court availability, membership comparisons, and instant enquiry capture routed directly into the receptionist lead follow-up & quoting desk. |
| **6. The owner, at the end of the month** | "How much did we earn, from where, and what do we owe?" | **Executive Suite & Finance Console**: Comprehensive P&L dashboard breaking revenue down by business channel (Courts, Shop, Bar) and payment method (Cash, Card, UPI). Integrated employee payroll, leave management, and tax reporting. |

---

## 🏛️ Architecture & Tech Stack

```
                         ┌──────────────────────────────────────────┐
                         │   Client Layer (React 18 + Vite + TS)    │
                         │   - Public Sanctuary & Showcase Pages    │
                         │   - 8 Bespoke Role-Based Portals         │
                         │   - Dual Theme: Obsidian (#000) & Day    │
                         └────────────────────┬─────────────────────┘
                                              │ HTTP / REST (Axios)
                                              ▼
                         ┌──────────────────────────────────────────┐
                         │    API Gateway & Security (Express 5)    │
                         │    - Helmet Security Headers & CORS      │
                         │    - JWT Access (15m) + Refresh (7d)     │
                         │    - Role-Based Access Control (RBAC)    │
                         │    - Sliding-Window Rate Limiting        │
                         └────────────────────┬─────────────────────┘
                                              │ mysql2 Connection Pool (SSL)
                                              ▼
                         ┌──────────────────────────────────────────┐
                         │   Aiven Cloud MySQL Database (64 Tables) │
                         │   - Relational Core & Foreign Keys       │
                         │   - Concurrency Locks & Trans. Safety    │
                         │   - Automated Audit & Financial Logs     │
                         └──────────────────────────────────────────┘
```

### Technology Highlights
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS v4, Framer Motion, Lenis Smooth Scroll, Lucide Icons, React Hot Toast, react-qr-code, html5-qrcode.
- **Backend**: Node.js v22, Express v5, TypeScript/JavaScript CommonJS, MySQL2, Bcrypt, JWT (Access + Refresh Rotation), Nodemailer, Google OAuth 2.0.
- **Database**: Cloud MySQL (Aiven Managed Cluster) with 64 normalized tables, SSL encryption, and foreign key integrity.

---

## 👥 Role-Based Access Control (RBAC) Matrix

The system features 8 specialized workspaces designed around club operations:

| Role | Portal URL | Target Persona | Key Responsibilities & Capabilities |
|---|---|---|---|
| **👑 Owner** | `/owner` | Club Owner / Board | Executive P&L analytics, channel revenue breakdown, cashflow, strategic KPIs, shareable PDF reports. |
| **⚙️ Admin** | `/admin` | System Administrator | Role and permission assignment, system audit logs, database maintenance, user account security. |
| **💼 Manager** | `/manager` | General Manager | Court rate rules, shift scheduling, staff leave approvals, inventory purchase orders, daily financial closings. |
| **🛎️ Front Desk** | `/frontdesk` | Reception & Concierge | QR/manual member check-ins, court grid reservations, member dossier lookups, enquiry CRM, counter billing. |
| **💳 Accountant**| `/accountant` | Chief Financial Officer | Invoicing, accounts receivable/payable, tax returns (GST/VAT), payroll processing, ledger balances. |
| **🍸 Bar Staff** | `/bar` | F&B / Bartenders | Kitchen Display System (KDS), table management, running tabs, automated member discounts, shift drawer tally. |
| **🛍️ Shop Staff**| `/shop-station` | Pro Shop Concierge | Barcode inventory management, counter POS sales, member locker pickup fulfillment, restock logging. |
| **🏅 Member** | `/member` | Club Member | Digital QR pass, court booking calendar, subscription upgrades, online invoice settlement, gear orders. |

---

## 🔑 Pre-Seeded Demo Credentials

All test accounts across all roles use the standardized password: **`Password@123`**

| Role | Name | Email | Default Dashboard |
|---|---|---|---|
| **Club Owner** | Rajesh Malhotra | `owner@championsclub.example` | `/owner` |
| **System Admin** | Vikram Batra | `admin@championsclub.example` | `/admin` |
| **General Manager** | Sunita Rao | `sunita.rao@championsclub.example` | `/manager` |
| **Front Desk Lead** | Priya Nair | `priya.nair@championsclub.example` | `/frontdesk` |
| **Chief Accountant** | Meera Bhatt | `meera.bhatt@bhattassociates.example` | `/accountant` |
| **Bar / Lounge Staff**| Imran Shaikh | `imran.shaikh@championsclub.example` | `/bar` |
| **Pro Shop Staff** | Neha Kulkarni | `neha.kulkarni@championsclub.example` | `/shop-station` |
| **Club Member** | Ananya Singh | `ananya.singh@example.com` | `/member` |

> 💡 **Tip:** On the [Login Page](http://localhost:5173/login), a **Quick Demo Switcher** bar allows one-click credential autofill for immediate role testing.

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Node.js** (v18.x, v20.x, or v22.x recommended)
- **npm** (v9.x or v10.x)
- MySQL instance (or connection to Aiven Cloud MySQL)

### 1. Repository Setup
```bash
git clone <repository-url>
cd TheChampionsClub
```

### 2. Backend Configuration & Startup
```bash
cd Backend

# Copy environment variables
cp .env.example .env

# Install backend dependencies
npm install

# Start development server with file watch
npm run dev
```
The Backend API will be live at `http://localhost:5000` (`/api/health` returns `{ "status": "ok" }`).

### 3. Frontend Configuration & Startup
Open a separate terminal:
```bash
cd FrontEnd

# Copy environment variables
cp .env.example .env

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```
The Frontend Web Application will be live at `http://localhost:5173`.

---

## 🧪 Automated Testing & Verification

The repository includes comprehensive automated test suites covering backend routes, database constraints, business rules, and security boundaries.

### 1. Full E2E & RBAC Suite (20 Tests)
```bash
cd Backend
node test_full_suite.js
```
- ✅ Health endpoint verification
- ✅ Member registration with automatic welcome tier provisioning
- ✅ Member profile update, QR pass generation, and digital code verification
- ✅ Court booking engine, rolling availability, and booking cancellation
- ✅ Member e-commerce shop order placement and order history retrieval
- ✅ Front desk QR-token and manual member check-in recording
- ✅ Front desk interactive court grid inspection and invoice lookups
- ✅ Public enquiry lead capture and front desk status progression
- ✅ Strict RBAC security boundary verification (Member 403 on Front Desk, Front Desk 403 on Member Portal, Unauthenticated 401)

### 2. Edge Case & Concurrency Suite
```bash
cd Backend
node test_edge_cases.js
```
- ✅ Staff registration and role mapping
- ✅ Front desk membership upgrades and auto-invoice generation
- ✅ Partial online card payment combined with front desk cash settlement
- ✅ **Court Conflict Prevention**: Verifies `409 Conflict` when booking overlapping slots on the same court
- ✅ **Daily Booking Quota**: Verifies `429 Too Many Requests` when a member exceeds the maximum 2 bookings/day limit

---

## 📁 Repository File Structure

```
TheChampionsClub/
├── Backend/                                  # Express API Server & Cloud DB Engine
│   ├── .env                                  # Cloud MySQL connection, JWT secrets, OAuth, Mail
│   ├── package.json                          # Backend dependencies
│   ├── server.js                             # Server startup entrypoint
│   ├── schema.sql                            # Base SQL schema definitions
│   ├── test_full_suite.js                    # 20-step automated E2E & RBAC verification
│   ├── test_edge_cases.js                    # Conflict, quota & financial edge test suite
│   ├── scripts/
│   │   ├── provision_system_admin.js         # Admin bootstrapping script
│   │   └── check_roles.js                    # Database role inspector
│   └── src/
│       ├── app.js                            # Express app setup, CORS, route mounting
│       ├── config/
│       │   ├── db.js                         # Aiven MySQL pool with SSL TLS support
│       │   └── env.js                        # Environment configuration validation
│       ├── controllers/                      # Domain logic (auth, member, receptionist, bar, shop, etc.)
│       ├── middleware/                       # JWT auth, RBAC requireRole, rate limiting
│       ├── routes/                           # Modular Express API routers
│       └── services/                         # Auth, token rotation, email delivery
│
├── FrontEnd/                                 # React 18 + Vite + TypeScript Application
│   ├── .env                                  # VITE_API_URL configuration
│   ├── index.html                            # Root HTML template with luxury typography
│   ├── vite.config.ts                        # Vite bundler & plugin configuration
│   ├── tsconfig.json                         # TypeScript compiler options
│   ├── package.json                          # Frontend dependencies
│   └── src/
│       ├── api/client.ts                     # Axios client with auto-refresh on 401
│       ├── context/                          # Global AuthContext & ThemeContext
│       ├── constants/                        # Club metadata, pricing, route definitions
│       ├── services/                         # Typed API client services for each role
│       ├── types/                            # Domain TypeScript interfaces
│       ├── components/                       # UI component library, modals, navigation
│       └── pages/                            # Public pages and 8 role-specific portals
│
└── README.md                                 # Comprehensive project documentation
```

---

## 🛡️ Security & Business Safeguards

1. **Authentication & Session Security**:
   - Access tokens (15-minute expiry) and Refresh tokens (7-day rotation) delivered via HTTP-only, SameSite cookies and Bearer tokens.
   - Passwords hashed using industry-standard `bcrypt` (10 rounds).
2. **Double-Booking & Concurrency Protection**:
   - Database transactions and interval queries prevent overlapping reservations on any court (`409 Conflict`).
3. **Quota Protection**:
   - Strictly limits members to a maximum of 2 court bookings per calendar day to ensure fair access during peak hours.
4. **Data Isolation**:
   - Every role endpoint enforces strict `requireRole(...)` middleware, guaranteeing that staff and member privileges never bleed into one another.

---

## 🏆 The Champions Club — Experience The Difference
Built with precision engineering, obsessive attention to detail, and a commitment to transforming sports club operations into an effortless luxury experience.
