# Auth2 — Full Authentication System

A production-ready authentication system built with:

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: MySQL (raw queries with `mysql2`)
- **Sessions**: JWT (access + refresh tokens) in HTTP-only cookies
- **Passwords**: bcrypt (saltRounds: 12)
- **Email**: Nodemailer (Gmail App Password)
- **OAuth**: Google OAuth 2.0

---

## Features

- ✅ Email + password registration with validation
- ✅ Password strength enforcement (8+ chars, uppercase, number, special char)
- ✅ Duplicate email prevention
- ✅ Welcome email on registration
- ✅ Secure login with generic error messages (no user enumeration)
- ✅ JWT access token (15 min) + refresh token (7 days) rotation
- ✅ Forgot password via 6-digit OTP (10 min expiry, max 5 attempts)
- ✅ Google OAuth 2.0 with account linking
- ✅ Rate limiting on all auth routes
- ✅ Helmet security headers
- ✅ CORS configured for frontend origin

---

## Project Structure

```
auth2/
├── client/          # React + Vite frontend (port 5173)
└── server/          # Express backend (port 5000)
    └── schema.sql   # MySQL database schema
```

---

## Quick Start

### 1. Database Setup

Create the MySQL database and tables:

```bash
mysql -u root -p < server/schema.sql
```

### 2. Server Setup

```bash
cd server

# Copy and fill in environment variables
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Client Setup

```bash
cd client

# Copy and fill in environment variables
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Environment Variables

### Server (`server/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `DB_HOST` | MySQL host |
| `DB_PORT` | MySQL port (default: 3306) |
| `DB_USER` | MySQL user |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | MySQL database name |
| `ACCESS_TOKEN_SECRET` | JWT access token secret (min 32 chars) |
| `REFRESH_TOKEN_SECRET` | JWT refresh token secret (min 32 chars) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Google OAuth callback URL |
| `GMAIL_USER` | Gmail address for sending emails |
| `GMAIL_APP_PASSWORD` | Gmail App Password (16 chars) |
| `CLIENT_URL` | Frontend URL (default: http://localhost:5173) |

### Client (`client/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL (default: http://localhost:5000/api) |

---

## Generating JWT Secrets

```bash
node -e "require('crypto').randomBytes(64).toString('hex').split('').slice(0,64).join('') |> console.log"
# or simply:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → **APIs & Services** → **Credentials**
3. Create **OAuth 2.0 Client ID** (Web application)
4. Add Authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
5. Copy Client ID and Client Secret to `server/.env`

---

## Gmail App Password Setup

1. Enable 2-Step Verification on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new App Password for "Mail"
4. Copy the 16-character password to `GMAIL_APP_PASSWORD` in `server/.env`

---

## API Routes

| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register with email + password | 5/15min |
| `POST` | `/api/auth/login` | Login with email + password | 10/15min |
| `POST` | `/api/auth/logout` | Logout (clears cookies) | — |
| `POST` | `/api/auth/refresh` | Rotate access token | 20/15min |
| `GET` | `/api/auth/google` | Redirect to Google OAuth | — |
| `GET` | `/api/auth/google/callback` | Google OAuth callback | — |
| `POST` | `/api/auth/forgot-password` | Request OTP via email | 3/15min |
| `POST` | `/api/auth/reset-password` | Reset password with OTP | 5/15min |
| `GET` | `/api/auth/me` | Get current user (protected) | — |

---

## Security Notes

- Passwords are hashed with **bcrypt** (saltRounds: 12)
- OTPs are hashed with **SHA-256** before storage
- Refresh tokens are stored as **SHA-256 hashes**
- **No user enumeration** — forgot-password always returns success
- **Generic login errors** — "Invalid email or password"
- All sessions terminated on password reset
