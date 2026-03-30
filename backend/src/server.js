require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static('public/uploads'));

// Import Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const whatsappRoutes = require('./routes/whatsapp');
const precoRoutes = require('./routes/precos');
const pedidoRoutes = require('./routes/pedidos');
const noticiasRoutes = require('./routes/noticias');
const adminCatalogRoutes = require('./routes/adminCatalog');
const masterAdminRoutes = require('./routes/masterAdmin');
const pagamentosRoutes = require('./routes/pagamentos');
const clientesRoutes = require('./routes/clientes');

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/precos', precoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/noticias', noticiasRoutes);
app.use('/api/admin/catalogo', adminCatalogRoutes);
app.use('/api/admin/master', masterAdminRoutes);
app.use('/api/pagamentos', pagamentosRoutes);
app.use('/api/clientes', clientesRoutes);

// Error Handling
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('🏁 Iniciando app.listen...');
const server = app.listen(PORT, () => {
  console.log(`
  🚀 SaaS CRM 2.0 Backend Running
  📡 Port: ${PORT}
  🔗 http://localhost:${PORT}
  `);
});

server.on('error', (e) => {
  console.error('❌ Server Listen Error:', e);
});

process.on('exit', (code) => {
  console.log(`📡 Process exiting with code: ${code}`);
});

module.exports = { prisma };
