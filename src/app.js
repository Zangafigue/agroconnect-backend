const express = require('express');
const rateLimit = require('express-rate-limit');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const swaggerUi   = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();

// -- Configuration Proxy (Nécessaire pour Railway / express-rate-limit) --------
app.set('trust proxy', 1);

// -- Middlewares globaux ------------------------------------------------------
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3001',
    /\.vercel\.app$/,
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// -- Rate Limiting -------------------------------------------------------------
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de requêtes, réessayez dans 15 minutes.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // plus strict pour les routes sensibles
  message: { message: 'Trop de tentatives de connexion, réessayez dans 15 minutes.' }
});
app.use(globalLimiter);

// -- Documentation Swagger ----------------------------------------------------
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// -- Routes -------------------------------------------------------------------
app.use('/api/auth',          authLimiter, require('./routes/auth.routes'));
app.use('/api/products',      require('./routes/products.routes'));
app.use('/api/orders',        require('./routes/orders.routes'));
app.use('/api/deliveries',    require('./routes/deliveries.routes'));
app.use('/api/payments',      require('./routes/payments.routes'));
app.use('/api/conversations', require('./routes/messaging.routes'));
app.use('/api/disputes',      require('./routes/disputes.routes'));
app.use('/api/admin',         require('./routes/admin.routes'));
app.use('/api/buyer',         require('./routes/buyer.routes'));
app.use('/api/farmer',        require('./routes/farmer.routes'));
app.use('/api/wallet',        require('./routes/wallet.routes'));
app.use('/api/news',          require('./routes/news.routes'));
app.use('/api/settings',      require('./routes/settings.routes'));
app.use('/api/users',         require('./routes/user.routes'));
app.use('/api/producers',     require('./routes/user.routes')); // Alias for producerService
app.use('/api/notifications', require('./routes/notification.routes'));

// -- Health check -------------------------------------------------------------
app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', version: '1.0.0', env: process.env.NODE_ENV })
);

// -- 404 -----------------------------------------------------------------------
app.use((req, res) => res.status(404).json({ message: 'Route non trouvée' }));

// -- Error handler global -----------------------------------------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Erreur serveur' });
});

module.exports = app;
