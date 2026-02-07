const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./config/database');

dotenv.config();

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Ensure critical environment variables exist before proceeding
const requiredEnv = ['JWT_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error('Missing required environment variables:', missingEnv.join(', '));
  console.error('Tip: run "npm run setup" (or node setup-env.js) to create backend/.env, then set the values.');
  process.exit(1);
}

// Middleware
const allowedOrigins = (process.env.CLIENT_ORIGIN || '').split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/services', require('./routes/services'));
app.use('/api/availability', require('./routes/availability'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/contact', require('./routes/contact'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5001;

// Start server
async function startServer() {
  try {
    // Test database connection using promise pool
    const connection = await db.getConnection();
    console.log('Database connected successfully');
    connection.release();
    
    app.locals.dbConnected = true;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('Database connection error:', err.message);
    console.error('Server will still start, but API endpoints that require the database will return errors until DB is available.');
    app.locals.dbConnected = false;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (DB unavailable)`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  }
}

startServer();

