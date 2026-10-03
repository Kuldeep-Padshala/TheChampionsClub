require('dotenv').config();

module.exports = {
  env: {
    isProduction: process.env.NODE_ENV === 'production',
    jwtSecret: process.env.JWT_SECRET || 'supersecretkey_championsclub',
    port: process.env.PORT || 5000,
    gmail: {
      user: process.env.GMAIL_USER || '',
      appPassword: process.env.GMAIL_PASSWORD || ''
    }
  }
};
