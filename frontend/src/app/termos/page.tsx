'use client';

import Link from "next/link";
import { Shield, FileText, ChevronLeft } from "lucide-react";

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-background text-foreground py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-12 transition-colors font-bold uppercase tracking-widest text-xs">
          <ChevronLeft size={16} /> Voltar ao Início
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
           <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <FileText className="text-blue-400" size={24} />
           </div>
           <h1 className="text-5xl font-black italic tracking-tighter uppercase italic">Termos de <span className="text-primary">Serviço</span></h1>
        </div>

        <div className="glass-panel p-10 rounded-[3rem] border-white/5 space-y-8 text-slate-300 leading-relaxed font-medium">
          <section>
            <h2 className="text-white text-2xl font-black mb-4 uppercase italic">1. Aceitação dos Termos</h2>
            <p>Ao acessar e utilizar a plataforma Manto PRO, você concorda em cumprir estes termos de serviço. Nossa plataforma é uma ferramenta de gestão e intermediação de informações para revendedores de artigos esportivos premium.</p>
          </section>

          <section>
            <h2 className="text-white text-2xl font-black mb-4 uppercase italic">2. Licença de Uso</h2>
            <p>Concedemos uma licença limitada, não exclusiva e intransferível para acessar as ferramentas de CRM, Catálogo Inteligente e Automação de WhatsApp. O uso da plataforma é exclusivo para fins comerciais lícitos.</p>
          </section>

          <section>
            <h2 className="text-white text-2xl font-black mb-4 uppercase italic">3. Assinaturas e Pagamentos</h2>
            <p>O acesso às funcionalidades avançadas do Manto PRO é liberado mediante o pagamento de mensalidades. A falta de pagamento resultará na suspensão imediata do acesso ao painel administrativo até a regularização.</p>
          </section>

          <section>
            <h2 className="text-white text-2xl font-black mb-4 uppercase italic">4. Responsabilidade do Usuário</h2>
            <p>O usuário é inteiramente responsável pelas informações cadastradas, vendas realizadas e pela comunicação com seus clientes finais através da nossa integração com o WhatsApp.</p>
          </section>

          <section>
            <h2 className="text-white text-2xl font-black mb-4 uppercase italic">5. Modificações no Serviço</h2>
            <p>Reservamo-nos o direito de atualizar ou modificar a plataforma para melhorias constantes, podendo alterar funcionalidades ou interfaces para otimizar a experiência do parceiro.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
