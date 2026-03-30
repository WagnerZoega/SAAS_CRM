const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

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

// ============================================================
// GET /list — listar todos os clientes da empresa autenticada
// ============================================================
router.get('/list', auth, async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      where: { empresa_id: req.empresaId },
      include: { _count: { select: { pedidos: true } } },
      orderBy: { criado_em: 'desc' }
    });
    res.json(clientes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar cliente manualmente pelo parceiro
router.post('/create', auth, async (req, res) => {
  const { nome, telefone, email, cpf, logradouro, numero, complemento, bairro, cidade, estado, cep } = req.body;
  if (!nome || !telefone) return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
  try {
    const cliente = await prisma.cliente.upsert({
      where: { telefone },
      update: { nome, email, cpf, logradouro, numero, complemento, bairro, cidade, estado, cep, empresa_id: req.empresaId },
      create: { nome, telefone, email, cpf, logradouro, numero, complemento, bairro, cidade, estado, cep, empresa_id: req.empresaId }
    });
    res.json(cliente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PUT /:id — Editar cliente
// ============================================================
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { nome, telefone, email, cpf, logradouro, numero, complemento, bairro, cidade, estado, cep, observacoes } = req.body;
  try {
    const cliente = await prisma.cliente.findUnique({ where: { id: parseInt(id) } });
    if (!cliente || cliente.empresa_id !== req.empresaId) {
      return res.status(403).json({ error: 'Acesso negado ou cliente não encontrado' });
    }
    const updated = await prisma.cliente.update({
      where: { id: parseInt(id) },
      data: { nome, telefone, email, cpf, logradouro, numero, complemento, bairro, cidade, estado, cep, observacoes }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// DELETE /:id — Excluir cliente (com validação de empresa)
// ============================================================
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const cliente = await prisma.cliente.findUnique({ where: { id: parseInt(id) } });
    if (!cliente || cliente.empresa_id !== req.empresaId) {
      return res.status(403).json({ error: 'Acesso negado ou cliente não encontrado' });
    }
    await prisma.cliente.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Cliente excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registro completo do cliente (com senha)
router.post('/register', async (req, res) => {
  const { nome, telefone, email, password, empresaId, cpf, logradouro, numero, complemento, bairro, cidade, estado, cep } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const cliente = await prisma.cliente.create({
      data: { nome, telefone, email, senha_hash: hash, cpf, logradouro, numero, complemento, bairro, cidade, estado, cep, empresa_id: parseInt(empresaId) }
    });
    res.json({ success: true, clienteId: cliente.id });
  } catch (err) {
    console.error('Erro Reg:', err);
    res.status(400).json({ error: 'Erro no cadastro (telefone ou CPF já existe?)' });
  }
});

// Login do cliente na loja
router.post('/login', async (req, res) => {
  const { telefone, password } = req.body;
  try {
    const cliente = await prisma.cliente.findUnique({ where: { telefone } });
    if (!cliente || !cliente.senha_hash) return res.status(401).json({ error: 'Credenciais inválidas' });

    const valid = await bcrypt.compare(password, cliente.senha_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });

    res.json({ success: true, cliente: { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /checkout-register — Registro rápido no checkout (sem senha)
// ============================================================
router.post('/checkout-register', async (req, res) => {
  const { nome, telefone, empresaId, cpf, logradouro, numero, complemento, bairro, cidade, estado, cep } = req.body;
  try {
    const cliente = await prisma.cliente.upsert({
      where: { telefone },
      update: { nome, cpf, logradouro, numero, complemento, bairro, cidade, estado, cep, empresa_id: parseInt(empresaId) },
      create: { nome, telefone, cpf, logradouro, numero, complemento, bairro, cidade, estado, cep, empresa_id: parseInt(empresaId) }
    });
    res.json(cliente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
