# 🏆 The Champions Club - Sports Management System

Welcome to the frontend repository for **The Champions Club**, a premium sports management system built with modern web technologies. This project provides a luxurious, high-end user interface for exploring club facilities, booking courts, purchasing gear, and exploring membership plans.

## ✨ Features

- **Public Mode (Phase 1)**: Users can browse courts, gear, menus, and memberships without logging in.
- **Luxury UI/UX**: Premium light theme with champagne gold accents, rich slate typography, and glassmorphism elements.
- **Interactive Court Booking (Preview)**: View a 7-day slot calendar with real-time availability states (Available, Booked, Social Play).
- **Pro Shop**: Browse tennis, cricket, and badminton gear with dynamic category filters.
- **Cafe & Bar Menu**: Explore club food and beverages categorized by tabs with dietary indicators.
- **Membership Comparison**: Detailed breakdown of Gold, Silver, and Junior plans.

## 🛠 Tech Stack

- **Framework**: [React 18](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js (v18+) installed on your machine.

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repo-url>
   cd TheChampionsClub/FrontEnd
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   *(Note: A `requirements.txt` is included for stack reference, but Node.js uses `package.json` for actual dependency management).*

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173/`.

## 📁 Project Structure Highlights

- `src/components/` - Reusable UI elements (cards, buttons, modals, navbar)
- `src/pages/` - Core route components (Home, Courts, Shop, Memberships, etc.)
- `src/data/` - Mock JSON data powering the Phase 1 UI
- `src/services/` - Data fetching layer (ready to be connected to a real backend API)
- `src/index.css` - Global styles and luxury theme configuration tokens

For a detailed breakdown of every folder and file, please refer to the `STRUCTURE.md` file included in this directory.

## 🔮 Roadmap

- [x] **Phase 1**: Public UI, Routing, Theme, Mock Data
- [ ] **Phase 2**: Member Authentication, Real API Integration
- [ ] **Phase 3**: Staff Mode / POS System
- [ ] **Phase 4**: Admin Dashboard

## 🤝 Contributing

When contributing to this repository, please ensure that you don't push the `node_modules/` or `dist/` folders. These are correctly ignored by the included `.gitignore` file.
