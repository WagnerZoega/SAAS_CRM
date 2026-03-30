const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log(`[LOGIN] Tentativa para email: ${email}`);
    const empresa = await prisma.empresa.findUnique({ where: { email } });
    
    if (!empresa) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const valid = await bcrypt.compare(password, empresa.senha_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: empresa.id, slug: empresa.slug, nome: empresa.nome },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, empresa: { id: empresa.id, nome: empresa.nome, slug: empresa.slug, faturamento_ativo: empresa.faturamento_ativo } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register
router.post('/register', async (req, res) => {
  const { nome, email, password, slug, responsavel, telefone } = req.body;
  
  if (!email || !password || !nome) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    
    // Fallback para slug se não for enviado
    const finalSlug = slug || nome.toLowerCase().replace(/[^a-z0-0]/g, '-');

    const empresa = await prisma.empresa.create({
      data: { 
        nome, 
        email, 
        senha_hash: hash, 
        slug: finalSlug,
        responsavel: responsavel || nome,
        telefone: telefone || null
      }
    });

    res.json({ message: 'Empresa criada com sucesso', id: empresa.id });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(400).json({ error: 'Erro ao criar empresa (slug ou email já existem?)' });
  }
});

// Obter dados do usuário logado
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const empresa = await prisma.empresa.findUnique({
      where: { id: decoded.id },
      select: { id: true, nome: true, email: true, slug: true, faturamento_ativo: true, responsavel: true, telefone: true, logo_url: true, pix_key: true, instagram: true, bio: true, cor_primaria: true, eh_master: true }
    });
    
    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' });
    res.json(empresa);
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

// Obter estatísticas do painel do parceiro
router.get('/me/dashboard', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const empresa = await prisma.empresa.findUnique({
      where: { id: decoded.id },
      include: {
        clientes: { orderBy: { criado_em: 'desc' } },
        pedidos: { 
          orderBy: { criado_em: 'desc' },
          include: { cliente: true }
        }
      }
    });

    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' });

    // CÁLCULOS DO DASHBOARD
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    console.log(`[Dash] Empresa: ${empresa.nome} | Pedidos total: ${empresa.pedidos.length}`);
    console.log(`[Dash] Hoje: ${hoje.toISOString()} | InicioMes: ${inicioMes.toISOString()}`);

    const stats = {
      pedidos_hoje: empresa.pedidos.filter(p => new Date(p.criado_em) >= hoje).length,
      faturamento_mes: empresa.pedidos
        .filter(p => new Date(p.criado_em) >= inicioMes && p.status !== 'cancelado')
        .reduce((acc, p) => acc + parseFloat(p.total.toString()), 0),
      protocolos_ativos: empresa.pedidos.filter(p => !['entregue', 'cancelado'].includes(p.status)).length,
      total_clientes: empresa.clientes.length,
      vendas_7_dias: [0, 0, 0, 0, 0, 0, 0]
    };

    console.log(`[Dash] Stats calculados:`, stats);

    // Gráfico de 7 dias
    for (let i = 0; i < 7; i++) {
        const d = new Date(hoje);
        d.setDate(d.getDate() - (6 - i));
        const nextD = new Date(d);
        nextD.setDate(d.getDate() + 1);

        stats.vendas_7_dias[i] = empresa.pedidos.filter(p => {
            const dp = new Date(p.criado_em);
            return dp >= d && dp < nextD && p.status !== 'cancelado';
        }).length;
    }

    res.json({ ...empresa, stats });
  } catch (err) {
    console.error('Dash Error:', err);
    res.status(401).json({ error: 'Token inválido' });
  }
});

// Atualizar perfil do parceiro
router.post('/me/update', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { nome, responsavel, telefone, pix_key, instagram, logo_url, bio, cor_primaria } = req.body;

    const updated = await prisma.empresa.update({
      where: { id: decoded.id },
      data: {
        nome,
        responsavel,
        telefone,
        pix_key,
        instagram,
        logo_url,
        bio,
        cor_primaria
      }
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao atualizar perfil' });
  }
});

module.exports = router;
