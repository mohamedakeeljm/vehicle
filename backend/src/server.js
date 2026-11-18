import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import cron from 'node-cron';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import vehicleRoutes from './routes/vehicles.js';
import documentRoutes from './routes/documents.js';
import dashboardRoutes from './routes/dashboard.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import { runReminderJob } from './services/reminderScheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow frontend to load vehicle images/avatars
}));

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.APP_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in development
    }
  },
  credentials: true,
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiting (100 requests per 15 minutes per IP for general endpoints)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
});

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many authentication attempts, please try again after 15 minutes.' },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Static uploads directory for vehicle images
const uploadsPath = path.resolve(process.env.UPLOAD_DIR || './uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'VehicleGuard LK Backend',
    timezone: process.env.TIMEZONE || 'Asia/Colombo',
    timestamp: new Date().toISOString(),
  });
});

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
  });
});

// Setup Scheduled Background Cron Job (Sri Lanka Standard Time Asia/Colombo)
// Default: Daily at 7:00 AM Asia/Colombo (0 7 * * *)
const cronExpression = process.env.REMINDER_CRON || '0 7 * * *';
const timeZone = process.env.TIMEZONE || 'Asia/Colombo';

if (process.env.NODE_ENV !== 'test') {
  cron.schedule(
    cronExpression,
    async () => {
      console.log(`⏰ Triggering daily scheduled reminder job at Sri Lanka Time (${timeZone})`);
      await runReminderJob();
    },
    {
      scheduled: true,
      timezone: timeZone,
    }
  );
  console.log(`⏱️ Background scheduler initialized for timezone: ${timeZone} with cron [${cronExpression}]`);
}

// Start HTTP Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 VehicleGuard LK Server running on port ${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    console.log(`🇱🇰 Local Timezone: ${timeZone}`);
  });
}

export default app;
