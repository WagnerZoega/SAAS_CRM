const express = require('express');
const router = express.Router();
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EVOLUTION_URL = process.env.EVOLUTION_URL;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;

// Base config for Axios
const evoApi = axios.create({
  baseURL: EVOLUTION_URL,
  headers: { 'apikey': EVOLUTION_KEY }
});

// Create/Connect Instance
router.post('/connect/:empresaId', async (req, res) => {
  const { empresaId } = req.params;
  
  try {
    const empresa = await prisma.empresa.findUnique({ where: { id: parseInt(empresaId) } });
    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' });

    const instanceName = empresa.slug;
    
    // 1. Create instance in Evolution
    console.log(`[WHATSAPP] Criando/Buscando instância: ${instanceName}`);
    try {
      await evoApi.post('/instance/create', {
        instanceName,
        token: empresa.whatsapp_token || 'token_random',
        qrcode: true
      });
      console.log(`[WHATSAPP] Instância ${instanceName} preparada no Evolution.`);
    } catch (e) {
      const errorMsg = e.response?.data?.error || e.response?.data?.message || e.message;
      if (errorMsg.toString().toLowerCase().includes('already exists')) {
        console.log(`[WHATSAPP] Instância ${instanceName} já existe.`);
      } else {
        console.error(`[WHATSAPP] Erro na criação:`, errorMsg);
        // Não lançaremos erro aqui para tentar o GET QR Code caso a instância já esteja lá mas deu erro de conflito sutil
      }
    }

    // 2. Get QR Code
    const qrResponse = await evoApi.get(`/instance/connect/${instanceName}`);
    
    // 3. Update DB
    await prisma.whatsappInstancia.upsert({
      where: { empresa_id: empresa.id },
      update: {
        instance_name: instanceName,
        url_base: EVOLUTION_URL,
        status: 'connecting',
        qrcode_atual: qrResponse.data.base64 || qrResponse.data.code
      },
      create: {
        empresa_id: empresa.id,
        instance_name: instanceName,
        url_base: EVOLUTION_URL,
        status: 'connecting',
        qrcode_atual: qrResponse.data.base64 || qrResponse.data.code
      }
    });

    res.json({ qrcode: qrResponse.data.base64 || qrResponse.data.code });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao conectar WhatsApp', details: error.message });
  }
});

// Status Poll
router.get('/status/:instanceName', async (req, res) => {
  const { instanceName } = req.params;
  try {
    const response = await evoApi.get(`/instance/connectionState/${instanceName}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar status' });
  }
});

// Send Message Template
router.post('/send/:instanceName', async (req, res) => {
  const { instanceName } = req.params;
  const { number, text } = req.body;

  try {
    const response = await evoApi.post(`/message/sendText/${instanceName}`, {
      number: number.replace(/\D/g, ''),
      options: { delay: 1200, presence: 'composing' },
      textMessage: { text }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

module.exports = router;
