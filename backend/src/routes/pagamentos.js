const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CONFIGURAÇÃO MANUAL (Como o banco Inter está com certificados desabilitados)
const PIX_CHAVE_FIXA = "24.366.922/0001-85";
const PIX_QR_CODE_URL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${PIX_CHAVE_FIXA}`;

// 1. Gerar Cobrança PIX para o Parceiro (Modo Manual/Fixo)
router.post('/gerar-cobranca', async (req, res) => {
  const { empresaId, valor } = req.body;

  try {
    const txid = `CRM${empresaId}T${Date.now()}`;

    const pagamento = await prisma.pagamento.create({
      data: {
        empresa_id: parseInt(empresaId),
        valor: parseFloat(valor),
        status: 'pendente',
        external_id: txid,
        metodo: 'pix'
      }
    });

    // Retorna sempre os dados fixos solicitados
    res.json({
        id: pagamento.id,
        qr_code: PIX_CHAVE_FIXA,
        qr_code_base64: PIX_QR_CODE_URL,
        copia_e_cola: PIX_CHAVE_FIXA,
        manual_mode: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. WEBHOOK para Ativação Manual (Via Master Admin)
// Como não há integração automática sem certificados, a ativação será via Master Admin ou Simulação
router.post('/webhook', async (req, res) => {
  const { id } = req.body; // ID do pagamento para simular aprovação
  
  try {
    const pagamento = await prisma.pagamento.findFirst({
        where: { external_id: String(id) }
    });

    if (pagamento && pagamento.status === 'pendente') {
        await prisma.pagamento.update({
            where: { id: pagamento.id },
            data: { status: 'aprovado', pago_em: new Date() }
        });

        await prisma.empresa.update({
            where: { id: pagamento.empresa_id },
            data: { faturamento_ativo: true }
        });

        console.log(`[PIX_MANUAL] Loja ID ${pagamento.empresa_id} ativada manualmente!`);
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Erro no processamento manual:', err);
    res.status(500).send('Erro');
  }
});

// 3. Criar Assinatura (Modo Manual)
router.post('/criar-assinatura', async (req, res) => {
    const { empresaId, valor } = req.body;
  
    try {
      const pagamento = await prisma.pagamento.create({
        data: {
          empresa_id: parseInt(empresaId),
          valor: parseFloat(valor),
          status: 'pendente',
          external_id: `REC${empresaId}T${Date.now()}`,
          metodo: 'pix_recorrente'
        }
      });
  
      res.json({
          id: pagamento.id,
          qr_code: PIX_CHAVE_FIXA,
          qr_code_base64: PIX_QR_CODE_URL,
          copia_e_cola: PIX_CHAVE_FIXA,
          is_recurring: true,
          manual_mode: true
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

module.exports = router;
