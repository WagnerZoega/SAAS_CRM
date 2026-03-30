const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar todas as empresas (Master Admin)
router.get('/empresas', async (req, res) => {
  try {
    const empresas = await prisma.empresa.findMany({
      orderBy: { criado_em: 'desc' },
      select: {
          id: true,
          nome: true,
          responsavel: true,
          telefone: true,
          slug: true,
          email: true,
          faturamento_ativo: true,
          vencimento_plano: true,
          criado_em: true
      }
    });
    res.json(empresas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Alterar status de faturamento
router.post('/empresas/:id/toggle-acesso', async (req, res) => {
  const { id } = req.params;
  try {
    const empresa = await prisma.empresa.findUnique({ where: { id: parseInt(id) } });
    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' });

    const updated = await prisma.empresa.update({
      where: { id: parseInt(id) },
      data: { faturamento_ativo: !empresa.faturamento_ativo }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar dados completos de um parceiro específico
router.get('/dados-parceiro/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { clientes: true, pedidos: true }
        },
        pedidos: {
          take: 5,
          orderBy: { criado_em: 'desc' },
          select: {
            id: true,
            numero_pedido: true,
            total: true,
            status: true,
            criado_em: true
          }
        }
      }
    });

    if (!empresa) return res.status(404).json({ error: 'Parceiro não encontrado' });

    res.json(empresa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
