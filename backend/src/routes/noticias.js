const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/noticias - listagem com filtros
router.get('/', async (req, res) => {
  try {
    const { categoria, fonte, limit = 20, page = 1 } = req.query;

    const where = {};
    if (categoria && categoria !== 'todas') where.categoria = categoria;
    if (fonte) where.fonte = { contains: fonte, mode: 'insensitive' };

    const noticias = await prisma.noticiaFutebol.findMany({
      where,
      orderBy: { data_publicacao: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    const total = await prisma.noticiaFutebol.count({ where });

    res.json({ noticias, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/noticias/lancamentos - apenas lançamentos de camisas
router.get('/lancamentos', async (req, res) => {
  try {
    const lancamentos = await prisma.noticiaFutebol.findMany({
      where: { categoria: 'lancamento' },
      orderBy: { data_publicacao: 'desc' },
      take: 10
    });
    res.json(lancamentos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/noticias/jogos-hoje - resultados do dia
router.get('/jogos-hoje', async (req, res) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const jogos = await prisma.noticiaFutebol.findMany({
      where: {
        categoria: 'resultado',
        data_publicacao: { gte: hoje }
      },
      orderBy: { data_publicacao: 'desc' }
    });
    res.json(jogos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/noticias/webhook-refresh - chamado pelo n8n quando atualiza
router.post('/webhook-refresh', (req, res) => {
  console.log('📡 Feed atualizado pelo n8n às', new Date().toISOString());
  // SSE/WebSocket aqui se quiser push pro frontend
  res.json({ ok: true, refreshed_at: req.body.refreshed_at || new Date().toISOString() });
});

module.exports = router;
