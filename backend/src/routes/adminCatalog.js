const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  try { 
    const decoded = jwt.verify(token, JWT_SECRET);
    req.empresaId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Listar ligas para criação de produtos
router.get('/ligas', auth, async (req, res) => {
  try { 
    const ligas = await prisma.liga.findMany({
      include: { categoria: true }
    });
    res.json(ligas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar catálogo do parceiro
router.get('/config', auth, async (req, res) => {
  try { 
    const produtos = await prisma.produto.findMany({
      where: {
        OR: [
          { empresa_id: null },
          { empresa_id: req.empresaId }
        ]
      },
      include: {
        precos_empresas: {
          where: { empresa_id: req.empresaId }
        },
        time: { include: { liga: { include: { categoria: true } } } }
      },
      orderBy: { criado_em: 'desc' }
    });
    res.json(produtos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar preço, margem, ativo e INFO CUSTOMIZADA
router.post('/update', auth, async (req, res) => {
  const { produtoId, precoVenda, margem, ativo, nomeCustomizado, descricaoCustomizada, timeNomeCustomizado, fotoPrincipal, tipo } = req.body;
  
  console.log(`[UPDATE_PRODUCT] ID: ${produtoId} | Margem: ${margem} | Nome: ${nomeCustomizado}`);

  try { 
    const empresa = await prisma.empresa.findUnique({ where: { id: req.empresaId } });
    const isMaster = empresa?.eh_master === true;

    let finalPhotoUrl = null;
    if (fotoPrincipal && fotoPrincipal.startsWith('data:image')) {
      const base64Data = fotoPrincipal.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `custom_${req.empresaId}_${produtoId}_${Date.now()}.jpg`;
      const filepath = `public/uploads/${filename}`;
      fs.writeFileSync(filepath, buffer);
      finalPhotoUrl = `http://localhost:3001/uploads/${filename}`;
    } else if (fotoPrincipal === 'REMOVED') {
      finalPhotoUrl = 'REMOVED';
    }

    const prodIdInt = parseInt(produtoId);
    if (!prodIdInt) throw new Error('ID do produto inválido');

    const originalProd = await prisma.produto.findUnique({ where: { id: prodIdInt }, include: { time: true } });
    if (!originalProd) throw new Error('Produto não encontrado');

    // ATUALIZAÇÃO GLOBAL (COMUNITÁRIA)
    // Qualquer parceiro pode atualizar o nome/título base do produto e do time
    
    // 1. Atualizar Produto
    await prisma.produto.update({
      where: { id: prodIdInt },
      data: {
        nome: (nomeCustomizado || originalProd.nome),
        descricao: (descricaoCustomizada || originalProd.descricao),
        tipo: (tipo || originalProd.tipo),
        foto_principal: finalPhotoUrl && finalPhotoUrl !== 'REMOVED' ? finalPhotoUrl : originalProd.foto_principal
      }
    });

    // 2. Atualizar Time se o nome mudou
    if (timeNomeCustomizado && originalProd.time && originalProd.time.nome !== timeNomeCustomizado) {
      await prisma.time.update({
        where: { id: originalProd.time_id },
        data: { nome: timeNomeCustomizado }
      });
    }

    // SEMPRE ATUALIZAR/CRIAR PrecoEmpresa (para manter margem e status ativo do parceiro)
    const preco = await prisma.precoEmpresa.upsert({
      where: {
        empresa_id_produto_id: {
          empresa_id: req.empresaId,
          produto_id: prodIdInt
        }
      },
      update: {
        preco_venda: parseFloat(precoVenda?.toString().replace(',', '.')) || 0,
        margem: parseFloat(margem?.toString().replace(',', '.')) || 0,
        ativo: ativo !== false,
        // Se for master, limpamos as customizações locais pois já alteramos o global
        nome_customizado: isMaster ? null : (nomeCustomizado || undefined),
        descricao_customizada: isMaster ? null : (descricaoCustomizada || undefined),
        time_nome_customizado: isMaster ? null : (timeNomeCustomizado || undefined),
        foto_principal_customizada: finalPhotoUrl === 'REMOVED' ? null : (finalPhotoUrl || undefined)
      },
      create: {
        empresa_id: req.empresaId,
        produto_id: parseInt(produtoId),
        preco_venda: parseFloat(precoVenda?.toString().replace(',', '.')) || 0,
        margem: parseFloat(margem?.toString().replace(',', '.')) || 0,
        ativo: ativo !== false,
        nome_customizado: isMaster ? null : (nomeCustomizado || null),
        descricao_customizada: isMaster ? null : (descricaoCustomizada || null),
        time_nome_customizado: isMaster ? null : (timeNomeCustomizado || null),
        foto_principal_customizada: finalPhotoUrl === 'REMOVED' ? null : (finalPhotoUrl || null)
      }
    });

    res.json(preco);
  } catch (err) {
    console.error('[UPDATE_ERROR]', err);
    res.status(500).json({ error: err.message || 'Erro interno ao atualizar catálogo' });
  }
});

// Criar NOVO Time e Produto (Sugerido/Customizado)
router.post('/create-custom', auth, async (req, res) => {
  const { nome, descricao, precoCusto, timeNome, ligaId, fotoPrincipal, tipo } = req.body;

  try { 
    // 1. Garantir que o Time existe ou criar
    let time = await prisma.time.findFirst({
      where: { 
        nome: { equals: timeNome, mode: 'insensitive' }, 
        OR: [
          { empresa_id: req.empresaId },
          { empresa_id: null }
        ]
      }
    });

    if (!time) {
      time = await prisma.time.create({
        data: {
          nome: timeNome,
          slug: `${timeNome.toLowerCase().replace(/ /g, '-')}-${req.empresaId}-${Date.now()}`,
          liga_id: parseInt(ligaId),
          empresa_id: req.empresaId
        }
      });
    }

    // 2. Criar Produto
    const produto = await prisma.produto.create({
      data: {
        nome,
        descricao,
        tipo,
        slug: `${nome.toLowerCase().replace(/ /g, '-')}-${Date.now()}`,
        time_id: time.id,
        preco_custo: parseFloat(precoCusto) || 0,
        foto_principal: fotoPrincipal,
        empresa_id: req.empresaId
      }
    });

    // 3. Vincular Preço
    await prisma.precoEmpresa.create({
      data: {
        empresa_id: req.empresaId,
        produto_id: produto.id,
        preco_venda: parseFloat(precoCusto) + 100,
        margem: 100,
        ativo: true
      }
    });

    res.json(produto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/update-photos', auth, async (req, res) => {
  const { produtoId, fotos } = req.body;
  try { 
    const preco = await prisma.precoEmpresa.update({
      where: { empresa_id_produto_id: { empresa_id: req.empresaId, produto_id: parseInt(produtoId) } },
      data: { fotos_customizadas: fotos }
    });
    res.json(preco);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/global-margin', auth, async (req, res) => {
  const { margem } = req.body;
  try { 
    const produtos = await prisma.produto.findMany({ where: { OR: [{ empresa_id: null }, { empresa_id: req.empresaId }] } });
    for (const prod of produtos) {
      const custo = parseFloat(prod.preco_custo || 50);
      const venda = custo + parseFloat(margem);
      await prisma.precoEmpresa.upsert({
        where: { empresa_id_produto_id: { empresa_id: req.empresaId, produto_id: prod.id } },
        update: { preco_venda: venda, margem: margem, ativo: true },
        create: { empresa_id: req.empresaId, produto_id: prod.id, preco_venda: venda, margem: margem, ativo: true }
      });
    }
    res.json({ message: 'Preços atualizados com sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// EXCLUIR PRODUTO (GLOBAL)
router.delete('/produto/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const prodId = parseInt(id);
    if (!prodId) return res.status(400).json({ error: 'ID inválido' });
    
    // 1. Limpar preços em cascata manual
    await prisma.precoEmpresa.deleteMany({ where: { produto_id: prodId } });
    
    // 2. Excluir o produto
    await prisma.produto.delete({ where: { id: prodId } });

    res.json({ message: 'Produto excluído globalmente com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EXCLUIR TIME (GLOBAL)
router.delete('/time/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const timeId = parseInt(id);
    if (!timeId) return res.status(400).json({ error: 'ID inválido' });

    const produtos = await prisma.produto.findMany({ where: { time_id: timeId } });
    
    for (const p of produtos) {
       await prisma.precoEmpresa.deleteMany({ where: { produto_id: p.id } });
       await prisma.produto.delete({ where: { id: p.id } });
    }

    await prisma.time.delete({ where: { id: timeId } });
    res.json({ message: 'Time e todos os produtos removidos globalmente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EDITAR NOME DO TIME (GLOBAL)
router.put('/time/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { nome, escudoUrl } = req.body;
  try {
    const timeId = parseInt(id);
    await prisma.time.update({
      where: { id: timeId },
      data: { 
        nome: nome || undefined,
        escudo_url: escudoUrl || undefined
      }
    });
    res.json({ message: 'Time atualizado globalmente com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


