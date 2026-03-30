const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Middleware de Auth Master
const authMaster = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const empresa = await prisma.empresa.findUnique({ where: { id: decoded.id } });
    if (!empresa || !empresa.eh_master) {
      return res.status(403).json({ error: 'Acesso negado: Apenas Master Admins' });
    }
    req.empresaId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Listar todos os parceiros
router.get('/parceiros', authMaster, async (req, res) => {
  try {
    const empresas = await prisma.empresa.findMany({
      where: { eh_master: false },
      include: {
        _count: {
          select: { clientes: true, pedidos: true }
        }
      }
    });
    console.log(`[MASTER] Retornando ${empresas.length} parceiros para o painel.`);
    res.json(empresas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar catálogo de um parceiro específico para gestão de custos
router.get('/parceiro/:id/catalogo', authMaster, async (req, res) => {
  const { id } = req.params;
  try {
    const produtos = await prisma.produto.findMany({
      include: {
        precos_empresas: {
          where: { empresa_id: parseInt(id) }
        },
        time: { include: { liga: { include: { categoria: true } } } }
      }
    });
    res.json(produtos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar custo personalizado para um parceiro
router.post('/update-cost', authMaster, async (req, res) => {
  const { empresaId, produtoId, custoPersonalizado } = req.body;
  try {
    const update = await prisma.precoEmpresa.upsert({
      where: {
        empresa_id_produto_id: {
          empresa_id: parseInt(empresaId),
          produto_id: parseInt(produtoId)
        }
      },
      update: {
        preco_custo_personalizado: parseFloat(custoPersonalizado)
      },
      create: {
        empresa_id: parseInt(empresaId),
        produto_id: parseInt(produtoId),
        preco_custo_personalizado: parseFloat(custoPersonalizado),
        preco_venda: parseFloat(custoPersonalizado) + 100, // Margem default se for novo
        margem: 100,
        ativo: true
      }
    });
    res.json(update);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar produto global (ajustar catálogo para todos)
router.post('/update-product-global', authMaster, async (req, res) => {
  const { id, nome, descricao, precoCusto, fotoPrincipal } = req.body;
  try {
    const updated = await prisma.produto.update({
      where: { id: parseInt(id) },
      data: {
        nome,
        descricao,
        preco_custo: parseFloat(precoCusto),
        foto_principal: fotoPrincipal
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle Acesso SaaS
router.post('/parceiro/:id/toggle-acesso', authMaster, async (req, res) => {
  const { id } = req.params;
  try {
    const empresa = await prisma.empresa.findUnique({ where: { id: parseInt(id) } });
    const updated = await prisma.empresa.update({
      where: { id: parseInt(id) },
      data: { faturamento_ativo: !empresa.faturamento_ativo }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === GESTÃO DE CATÁLOGO GLOBAL ===

// 1. Estrutura Completa (Categorias > Ligas > Times)
router.get('/catalog-structure', authMaster, async (req, res) => {
  try {
    const data = await prisma.categoria.findMany({
      include: {
        ligas: {
          include: {
            times: {
              where: { empresa_id: null }, // Apenas times globais para o Master gerenciar aqui
              orderBy: { nome: 'asc' }
            }
          },
          orderBy: { nome: 'asc' }
        }
      },
      orderBy: { nome: 'asc' }
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Gerenciar Times
router.post('/time', authMaster, async (req, res) => {
  const { nome, ligaId, escudoUrl } = req.body;
  try {
    const time = await prisma.time.create({
      data: {
        nome,
        slug: nome.toLowerCase().replace(/ /g, '-') + '-' + Date.now(),
        liga_id: parseInt(ligaId),
        escudo_url: escudoUrl,
        empresa_id: null // Global
      }
    });
    res.json(time);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/time/:id', authMaster, async (req, res) => {
  const { id } = req.params;
  const { nome, ligaId, escudoUrl } = req.body;
  try {
    const updated = await prisma.time.update({
      where: { id: parseInt(id) },
      data: {
        nome,
        liga_id: ligaId ? parseInt(ligaId) : undefined,
        escudo_url: escudoUrl
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Gerenciar Ligas
router.post('/liga', authMaster, async (req, res) => {
  const { nome, categoriaId } = req.body;
  try {
    const liga = await prisma.liga.create({
      data: {
        nome,
        categoria_id: parseInt(categoriaId)
      }
    });
    res.json(liga);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/liga/:id', authMaster, async (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;
  try {
    const updated = await prisma.liga.update({
      where: { id: parseInt(id) },
      data: { nome }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir Liga (Global)
router.delete('/liga/:id', authMaster, async (req, res) => {
  const { id } = req.params;
  try {
    const ligaId = parseInt(id);
    // Cascada manual: Times -> Produtos -> PrecoEmpresa
    const times = await prisma.time.findMany({ where: { liga_id: ligaId } });
    for (const t of times) {
      const produtos = await prisma.produto.findMany({ where: { time_id: t.id } });
      for (const p of produtos) {
        await prisma.precoEmpresa.deleteMany({ where: { produto_id: p.id } });
        await prisma.produto.delete({ where: { id: p.id } });
      }
      await prisma.time.delete({ where: { id: t.id } });
    }
    await prisma.liga.delete({ where: { id: ligaId } });
    res.json({ message: 'Liga e toda sua estrutura removida com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Gerenciar Categorias
router.post('/categoria', authMaster, async (req, res) => {
  const { nome } = req.body;
  try {
    const cat = await prisma.categoria.create({
      data: {
        nome,
        slug: nome.toLowerCase().replace(/ /g, '-')
      }
    });
    res.json(cat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/categoria/:id', authMaster, async (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;
  try {
    const updated = await prisma.categoria.update({
      where: { id: parseInt(id) },
      data: { 
        nome,
        slug: nome.toLowerCase().replace(/ /g, '-')
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir Categoria (Global)
router.delete('/categoria/:id', authMaster, async (req, res) => {
  const { id } = req.params;
  try {
    const catId = parseInt(id);
    // Cascada manual profunda: Liga -> Times -> Produtos -> PrecoEmpresa
    const ligas = await prisma.liga.findMany({ where: { categoria_id: catId } });
    for (const l of ligas) {
      const times = await prisma.time.findMany({ where: { liga_id: l.id } });
      for (const t of times) {
        const produtos = await prisma.produto.findMany({ where: { time_id: t.id } });
        for (const p of produtos) {
          await prisma.precoEmpresa.deleteMany({ where: { produto_id: p.id } });
          await prisma.produto.delete({ where: { id: p.id } });
        }
        await prisma.time.delete({ where: { id: t.id } });
      }
      await prisma.liga.delete({ where: { id: l.id } });
    }
    await prisma.categoria.delete({ where: { id: catId } });
    res.json({ message: 'Categoria e toda sua estrutura removida com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir Parceiro
router.delete('/parceiro/:id', authMaster, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.empresa.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Parceiro excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
