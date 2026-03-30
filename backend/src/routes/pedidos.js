const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

const EVOLUTION_URL = process.env.EVOLUTION_URL;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;

async function sendWhatsApp(instance, number, message) {
  try {
    await axios.post(`${EVOLUTION_URL}/message/sendText/${instance}`, {
      number: number.replace(/\D/g, ''),
      options: { delay: 1200, presence: 'composing' },
      textMessage: { text: message }
    }, { headers: { 'apikey': EVOLUTION_KEY } });
    return true;
  } catch (e) {
    console.error('Falha WA:', e.message);
    return false;
  }
}

// Templates de mensagens por status
const STATUS_MESSAGES = {
  pago: (pedido, empresa) => `✅ *Pagamento Confirmado!*\n\nOlá *${pedido.cliente.nome}*!\n\nSeu pagamento do pedido *${pedido.numero_pedido}* foi confirmado com sucesso! 🎉\n\nEm breve começaremos a preparar sua encomenda.\n\n*${empresa.nome}* agradece a confiança! 🙏`,

  separacao: (pedido, empresa) => `📦 *Pedido em Separação!*\n\nOlá *${pedido.cliente.nome}*!\n\nSeu pedido *${pedido.numero_pedido}* já está sendo preparado e separado com carinho! 👕\n\nAssim que for despachado, você receberá o código de rastreio.\n\n*${empresa.nome}*`,

  etiqueta_gerada: (pedido, empresa) => `🏷️ *Etiqueta Gerada!*\n\nOlá *${pedido.cliente.nome}*!\n\nA etiqueta de envio do seu pedido *${pedido.numero_pedido}* foi gerada! 📋\n\nEm breve ele será despachado nos Correios/Transportadora.\n\n*${empresa.nome}*`,

  enviado: (pedido, empresa) => `🚀 *Pedido Enviado!*\n\nOlá *${pedido.cliente.nome}*!\n\nSeu pedido *${pedido.numero_pedido}* foi DESPACHADO! 🎉\n\n${pedido.rastreio_codigo ? `📍 *Código de Rastreio:* ${pedido.rastreio_codigo}\nAcompanhe em: https://rastreamento.correios.com.br` : 'O código de rastreio será enviado em breve.'}\n\n*${empresa.nome}*`,

  entregue: (pedido, empresa) => `🏆 *Pedido Entregue!*\n\nOlá *${pedido.cliente.nome}*!\n\nSeu pedido *${pedido.numero_pedido}* foi entregue com sucesso! ⚽🎉\n\nEsperamos que tenha amado sua camisa! Se puder, nos envie uma foto vestindo! 📸\n\nObrigado por comprar na *${empresa.nome}*! ❤️`,

  cancelado: (pedido, empresa) => `❌ *Pedido Cancelado*\n\nOlá *${pedido.cliente.nome}*!\n\nInfelizmente seu pedido *${pedido.numero_pedido}* foi cancelado.\n\nCaso precise de ajuda, entre em contato com a *${empresa.nome}*.`
};

// Create Order & WhatsApp Alert
router.post('/checkout', async (req, res) => {
  const { empresaId, cliente, itens, total } = req.body;

  try {
    const empresa = await prisma.empresa.findUnique({ where: { id: parseInt(empresaId) } });
    if (!empresa) return res.status(404).json({ error: 'Loja não encontrada' });

    const dbCliente = await prisma.cliente.upsert({
      where: { telefone: cliente.telefone },
      update: {
        nome: cliente.nome,
        cpf: cliente.cpf,
        logradouro: cliente.logradouro,
        numero: cliente.numero,
        complemento: cliente.complemento,
        bairro: cliente.bairro,
        cidade: cliente.cidade,
        estado: cliente.estado,
        cep: cliente.cep,
        empresa_id: empresa.id
      },
      create: {
        empresa_id: empresa.id,
        nome: cliente.nome,
        telefone: cliente.telefone,
        cpf: cliente.cpf,
        logradouro: cliente.logradouro,
        numero: cliente.numero,
        complemento: cliente.complemento,
        bairro: cliente.bairro,
        cidade: cliente.cidade,
        estado: cliente.estado,
        cep: cliente.cep
      }
    });

    const numPedido = `${empresa.slug.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-5)}`;
    const pedido = await prisma.pedido.create({
      data: {
        empresa_id: empresa.id,
        cliente_id: dbCliente.id,
        numero_pedido: numPedido,
        total: parseFloat(total),
        itens: itens,
        status: 'pendente'
      }
    });

    // WhatsApp notifications
    const instance = empresa.slug;
    const sellerWhatsApp = empresa.whatsapp_numero || "5521981496911";
    const enderecoFormatado = `${cliente.logradouro}, ${cliente.numero}${cliente.complemento ? ' (' + cliente.complemento + ')' : ''} - ${cliente.bairro}, ${cliente.cidade}/${cliente.estado} - CEP: ${cliente.cep}`;

    const customerMsg = `Olá *${cliente.nome}*! ✅ Recebemos seu pedido *${numPedido}* na *${empresa.nome}*.\n\n*Endereço de Entrega:* ${enderecoFormatado}\n\nEm breve entraremos em contato para finalizar a entrega!`;
    await sendWhatsApp(instance, cliente.telefone, customerMsg);

    const sellerMsg = `🚨 *NOVO PEDIDO RECEBIDO!* 🚨\n\n*Pedido:* ${numPedido}\n*Cliente:* ${cliente.nome} (${cliente.cpf})\n*Total:* R$ ${parseFloat(total).toFixed(2)}\n\n*Endereço:* ${enderecoFormatado}\n\nAcesse seu painel administrativo para ver os detalhes.`;
    await sendWhatsApp(instance, sellerWhatsApp, sellerMsg);

    res.json({ success: true, pedido });
  } catch (error) {
    console.error('Erro Pedido:', error);
    res.status(500).json({ error: 'Erro ao processar pedido' });
  }
});

// POST: Create Manual Order from Admin
router.post('/create-manual', async (req, res) => {
  const { empresaId, clienteId, items, total } = req.body;

  try {
    const empresa = await prisma.empresa.findUnique({ where: { id: parseInt(empresaId) } });
    if (!empresa) return res.status(404).json({ error: 'Loja não encontrada' });

    const dbCliente = await prisma.cliente.findUnique({ where: { id: parseInt(clienteId) } });
    if (!dbCliente) return res.status(404).json({ error: 'Cliente não encontrado' });

    const numPedido = `${empresa.slug.slice(0, 3).toUpperCase()}-MAN-${Date.now().toString().slice(-4)}`;
    const pedido = await prisma.pedido.create({
      data: {
        empresa_id: empresa.id,
        cliente_id: dbCliente.id,
        numero_pedido: numPedido,
        total: parseFloat(total || 0),
        itens: items,
        status: 'pendente'
      }
    });

    res.json({ success: true, pedido });
  } catch (error) {
    console.error('Erro Pedido Manual:', error);
    res.status(500).json({ error: 'Erro ao criar pedido manual' });
  }
});

// GET: List Orders for Partner
router.get('/list/:empresaId', async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      where: { empresa_id: parseInt(req.params.empresaId) },
      include: {
        cliente: {
          select: {
            id: true, nome: true, telefone: true, cpf: true, email: true,
            logradouro: true, numero: true, complemento: true, bairro: true,
            cidade: true, estado: true, cep: true
          }
        }
      },
      orderBy: { criado_em: 'desc' }
    });
    res.json(pedidos);
  } catch (error) {
    console.error('Erro listando pedidos:', error);
    res.status(500).json({ error: 'Erro ao listar pedidos' });
  }
});

// PUT: Update Order Status + Auto WhatsApp
router.put('/status/:pedidoId', async (req, res) => {
  const { status, rastreio_codigo, empresaId } = req.body;

  try {
    const updateData = { status };
    if (rastreio_codigo) updateData.rastreio_codigo = rastreio_codigo;

    const pedido = await prisma.pedido.update({
      where: { id: parseInt(req.params.pedidoId) },
      data: updateData,
      include: { cliente: true }
    });

    const empresa = await prisma.empresa.findUnique({ where: { id: parseInt(empresaId) } });

    // Auto-send WhatsApp notification based on status change
    if (empresa && pedido.cliente.telefone && STATUS_MESSAGES[status]) {
      const message = STATUS_MESSAGES[status](pedido, empresa);
      const instance = empresa.slug;
      const sent = await sendWhatsApp(instance, pedido.cliente.telefone, message);
      console.log(`[PEDIDO] Status ${pedido.numero_pedido} → ${status} | WhatsApp: ${sent ? '✅' : '❌'}`);
    }

    res.json({ success: true, pedido });
  } catch (error) {
    console.error('Erro atualizando status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// POST: Send custom WhatsApp message to client
router.post('/send-message', async (req, res) => {
  const { empresaId, clienteTelefone, message } = req.body;

  try {
    const empresa = await prisma.empresa.findUnique({ where: { id: parseInt(empresaId) } });
    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' });

    const instance = empresa.slug;
    const sent = await sendWhatsApp(instance, clienteTelefone, message);

    res.json({ success: sent });
  } catch (error) {
    console.error('Erro enviando mensagem:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// ============================================================
// DELETE /:id — Excluir pedido (apenas da empresa autenticada via token)
// ============================================================
router.delete('/:id', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'secret';
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const pedido = await prisma.pedido.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!pedido || pedido.empresa_id !== decoded.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    await prisma.pedido.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Pedido excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir pedido:', error);
    res.status(500).json({ error: 'Erro ao excluir pedido' });
  }
});

// ============================================================
// GET /export/:empresaId — Exportar pedidos como CSV
// ============================================================
router.get('/export/:empresaId', async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      where: { empresa_id: parseInt(req.params.empresaId) },
      include: { cliente: { select: { nome: true, telefone: true, cpf: true, cidade: true, estado: true } } },
      orderBy: { criado_em: 'desc' }
    });

    const header = ['Número', 'Status', 'Cliente', 'Telefone', 'CPF', 'Cidade/UF', 'Total', 'Rastreio', 'Data'];
    const rows = pedidos.map(p => [
      p.numero_pedido,
      p.status,
      p.cliente?.nome || '-',
      p.cliente?.telefone || '-',
      p.cliente?.cpf || '-',
      `${p.cliente?.cidade || '-'}/${p.cliente?.estado || '-'}`,
      parseFloat(p.total).toFixed(2),
      p.rastreio_codigo || '-',
      new Date(p.criado_em).toLocaleDateString('pt-BR')
    ]);

    const csv = [header, ...rows].map(r => r.join(';')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="pedidos-${req.params.empresaId}.csv"`);
    res.send('\uFEFF' + csv); // BOM for Excel compatibility
  } catch (error) {
    console.error('Erro ao exportar:', error);
    res.status(500).json({ error: 'Erro ao gerar exportação' });
  }
});

module.exports = router;
