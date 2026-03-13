const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const swaggerUi   = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();

// ── Middlewares globaux ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3001',
    /\.vercel\.app$/,
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Documentation Swagger ────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Routes ───────────────────────────────────────────────────────────────────// Routes (branchées par les membres)
app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/products',      require('./routes/products.routes'));
app.use('/api/orders',        require('./routes/orders.routes'));
app.use('/api/deliveries',    require('./routes/deliveries.routes'));
app.use('/api/payments',      require('./routes/payments.routes'));
app.use('/api/conversations', require('./routes/messaging.routes'));
app.use('/api/disputes',      require('./routes/disputes.routes'));
app.use('/api/admin',         require('./routes/admin.routes'));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', version: '1.0.0', env: process.env.NODE_ENV })
);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: 'Route non trouvée' }));

// ── Error handler global ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Erreur serveur' });
});

module.exports = app;
