const express = require('express');
const cors = require('cors');
require('dotenv').config();

const receptionistRoutes = require('./src/routes/receptionistRoutes');
const authRoutes = require('./src/routes/auth.routes').default || require('./src/routes/auth.routes');
const memberRoutes = require('./src/routes/member.routes').default || require('./src/routes/member.routes');
const managerRoutes = require('./src/routes/manager.routes');
const barRoutes = require('./src/routes/bar.routes');
const shopRoutes = require('./src/routes/shop.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/receptionist', receptionistRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/bar', barRoutes);
app.use('/api/shop', shopRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
