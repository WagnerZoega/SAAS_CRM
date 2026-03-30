const axios = require('axios');
const fs = require('fs');
const https = require('https');
const path = require('path');

class InterService {
    constructor() {
        this.clientId = process.env.INTER_CLIENT_ID;
        this.clientSecret = process.env.INTER_CLIENT_SECRET;
        this.certPath = path.resolve(__dirname, '../../certs/inter.crt');
        this.keyPath = path.resolve(__dirname, '../../certs/inter.key');
        
        this.baseUrl = 'https://cdpj.inter.co';
        this.tokenUrl = 'https://cdpj.inter.co/oauth/v2/token';
    }

    getHttpsAgent() {
        if (!fs.existsSync(this.certPath) || !fs.existsSync(this.keyPath)) {
            console.error('Certificados do Banco Inter não encontrados em:', this.certPath);
            return null;
        }

        return new https.Agent({
            cert: fs.readFileSync(this.certPath),
            key: fs.readFileSync(this.keyPath),
        });
    }

    async getAccessToken() {
        const agent = this.getHttpsAgent();
        if (!agent) throw new Error('Certificados não configurados');

        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('scope', 'pix.read pix.write recorrencia.read recorrencia.write');
        params.append('client_id', this.clientId);
        params.append('client_secret', this.clientSecret);

        try {
            const response = await axios.post(this.tokenUrl, params, {
                httpsAgent: agent,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            return response.data.access_token;
        } catch (error) {
            console.error('Erro ao obter token Inter:', error.response?.data || error.message);
            throw error;
        }
    }

    async createPixCharge(valor, description, txid) {
        const agent = this.getHttpsAgent();
        const token = await this.getAccessToken();

        const payload = {
            calendario: {
                expiracao: 3600
            },
            valor: {
                original: parseFloat(valor).toFixed(2)
            },
            chave: process.env.INTER_PIX_KEY || '24366922000185',
            solicitacaoPagador: description
        };

        try {
            // Se enviar txid é PUT, se não enviar é POST (e o Inter gera um)
            const endpoint = txid ? `${this.baseUrl}/pix/v2/cob/${txid}` : `${this.baseUrl}/pix/v2/cob`;
            const method = txid ? 'put' : 'post';

            const response = await axios({
                method,
                url: endpoint,
                data: payload,
                httpsAgent: agent,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Erro ao criar cobrança Inter:', error.response?.data || error.message);
            throw error;
        }
    }

    async registerWebhook(webhookUrl) {
        const agent = this.getHttpsAgent();
        const token = await this.getAccessToken();
        const chave = process.env.INTER_PIX_KEY || '24366922000185';

        try {
            await axios.put(`${this.baseUrl}/pix/v2/webhook/${chave}`, {
                webhookUrl: webhookUrl
            }, {
                httpsAgent: agent,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Webhook Inter registrado com sucesso:', webhookUrl);
            return true;
        } catch (error) {
            console.error('Erro ao registrar webhook Inter:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * PIX AUTOMÁTICO (Recorrência)
     * Cria uma configuração de assinatura onde o cliente autoriza débitos futuros.
     */
    async createSubscription(valor, description) {
        const agent = this.getHttpsAgent();
        const token = await this.getAccessToken();

        const payload = {
            chave: process.env.INTER_PIX_KEY || '24366922000185',
            valor: {
                original: parseFloat(valor).toFixed(2)
            },
            recorrencia: {
                tipoRecorrencia: 'MENSAL', // Pode ser DIARIO, SEMANAL, MENSAL, TRIMESTRAL, SEMESTRAL, ANUAL
                dataInicio: new Date().toISOString().split('T')[0],
                // dataFim: opcional
            },
            solicitacaoPagador: description
        };

        try {
            const response = await axios.post(`${this.baseUrl}/pix/v2/recorrencia`, payload, {
                httpsAgent: agent,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data; // Retorna txid e as instruções para o QR Code de Assinatura
        } catch (error) {
            console.error('Erro ao criar assinatura Pix Inter:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = new InterService();
