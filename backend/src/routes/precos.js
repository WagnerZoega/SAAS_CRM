const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar produtos de uma loja (slug) com categorias e detalhes
router.get('/loja/:slug', async (req, res) => {
  try {
    const empresa = await prisma.empresa.findUnique({ where: { slug: req.params.slug } });
    if (!empresa) return res.status(404).json({ error: 'Loja não encontrada' });

    const precos = await prisma.precoEmpresa.findMany({
      where: { empresa_id: empresa.id, ativo: true },
      include: { 
        produto: {
          include: {
            time: { include: { liga: { include: { categoria: true } } } }
          }
        } 
      }
    });

    // Mapear produtos para garantir que fotos e INFO customizadas sejam usadas
    const produtosFormatados = precos.map(p => {
      const prod = p.produto;
      return {
        ...p,
        produto: {
          ...prod,
          nome: p.nome_customizado || prod.nome,
          descricao: p.descricao_customizada || prod.descricao,
          fotos: p.fotos_customizadas.length > 0 ? p.fotos_customizadas : prod.fotos,
          time: {
            ...prod.time,
            nome: p.time_nome_customizado || prod.time.nome
          },
          preco_custo_efetivo: p.preco_custo_personalizado || prod.preco_custo
        }
      };
    });

    res.json({ empresa, produtos: produtosFormatados });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
