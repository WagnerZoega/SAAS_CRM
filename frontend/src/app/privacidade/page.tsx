'use client';

import Link from "next/link";
import { Shield, ChevronLeft } from "lucide-react";

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-background text-foreground py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-12 transition-colors font-bold uppercase tracking-widest text-xs">
          <ChevronLeft size={16} /> Voltar ao Início
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
           <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20">
              <Shield className="text-primary" size={24} />
           </div>
           <h1 className="text-5xl font-black italic tracking-tighter uppercase italic">Privacidade <span className="text-primary">& Dados</span></h1>
        </div>

        <div className="glass-panel p-10 rounded-[3rem] border-white/5 space-y-8 text-slate-300 leading-relaxed font-medium text-justify">
          <section>
            <h2 className="text-white text-2xl font-black mb-4 uppercase italic">1. Coleta de Informações</h2>
            <p>Coletamos informações necessárias para a operação do CRM, como nome da loja, email de contato e dados de configurações de WhatsApp. Esses dados são utilizados exclusivamente para o funcionamento técnico da sua conta.</p>
          </section>

          <section>
            <h2 className="text-white text-2xl font-black mb-4 uppercase italic">2. Segurança do WhatsApp</h2>
            <p>Não armazenamos o conteúdo das suas conversas. Nossa integração via Evolution API atua apenas como uma ponte técnica para o envio de notificações de pedidos e rastreios. O seu token e QR Code são criptografados.</p>
          </section>

          <section>
            <h2 className="text-white text-2xl font-black mb-4 uppercase italic">3. Sigilo Comercial</h2>
            <p>Entendemos o valor do seu negócio. As informações dos seus clientes finais e seu histórico de vendas são estritamente confidenciais e nunca serão compartilhados com terceiros ou outros usuários da plataforma.</p>
          </section>

          <section>
            <h2 className="text-white text-2xl font-black mb-4 uppercase italic">4. Seus Direitos</h2>
            <p>Em conformidade com a LGPD, você possui total direito de solicitar a exclusão definitiva dos seus dados e da sua conta a qualquer momento através do nosso suporte.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
