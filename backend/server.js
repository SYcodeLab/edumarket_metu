require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const path      = require('path');
const routes    = require('./routes');

const app  = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// ── SECURITY ──────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// Rate limiting — защита от DDoS
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 200,
  message: { error: 'Слишком много запросов, попробуйте через 15 минут' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// Более жёсткий лимит для auth
app.use('/api/auth/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Слишком много попыток входа' },
}));

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(s=>s.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Не разрешено CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (!isProd) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── API ───────────────────────────────────────────────────────────────────────
app.use('/api', routes);

// Health check — Render использует это для проверки
app.get('/health', (req, res) => {
  res.json({
    status:  'ok',
    env:     process.env.NODE_ENV || 'development',
    version: '2.0.0',
    time:    new Date().toISOString(),
  });
});

// ── FRONTEND (production) ─────────────────────────────────────────────────────
// Если фронтенд собран — отдаём из dist/
const distPath = path.join(__dirname, '../frontend/dist');
const fs = require('fs');
if (isProd && fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
} else if (!isProd) {
  app.get('/', (req, res) => {
    res.json({
      message: '🎓 EduMarket МИТУ API v2.0',
      docs: 'http://localhost:5000/api/stats',
      env: 'development',
    });
  });
}

// ── ERROR HANDLER ─────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Маршрут ${req.path} не найден` }));

app.use((err, req, res, next) => {
  console.error('❌', err.message);
  res.status(err.status || 500).json({ error: isProd ? 'Внутренняя ошибка сервера' : err.message });
});

// ── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════╗
║  🎓 EduMarket МИТУ API v2.0               ║
║  Mode: ${(process.env.NODE_ENV||'development').padEnd(10)} Port: ${PORT}         ║
║  API:  http://localhost:${PORT}/api          ║
╚════════════════════════════════════════════╝`);
});

module.exports = app;
