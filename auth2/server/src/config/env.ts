import dotenv from 'dotenv';
dotenv.config();

const required = [
  'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
  'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET',
  'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI',
  'GMAIL_USER', 'GMAIL_APP_PASSWORD',
  'CLIENT_URL'
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    name: process.env.DB_NAME!,
  },
  jwt: {
    accessSecret: process.env.ACCESS_TOKEN_SECRET!,
    refreshSecret: process.env.REFRESH_TOKEN_SECRET!,
    accessExpiry: '15m',
    refreshExpiry: '7d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
  },
  gmail: {
    user: process.env.GMAIL_USER!,
    appPassword: process.env.GMAIL_APP_PASSWORD!,
  },
  clientUrl: process.env.CLIENT_URL!,
  isProduction: process.env.NODE_ENV === 'production',
};
