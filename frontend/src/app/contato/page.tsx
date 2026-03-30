'use client';

import Link from "next/link";
import { Mail, MessageCircle, ChevronLeft, Headset, Clock } from "lucide-react";

export default function ContatoPage() {
  return (
    <main className="min-h-screen bg-background text-foreground py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-16 transition-colors font-bold uppercase tracking-widest text-xs">
          <ChevronLeft size={16} /> Voltar ao Início
        </Link>
        
        <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 mx-auto mb-8">
            <Headset className="text-primary" size={40} />
        </div>
        <h1 className="text-6xl font-black italic tracking-tighter uppercase italic mb-4">Suporte <span className="text-primary italic">Manto PRO</span></h1>
        <p className="text-slate-400 max-w-xl mx-auto mb-16 font-medium">Estamos aqui para ajudar você a escalar suas vendas. Escolha seu canal de atendimento preferido.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <a href="mailto:vendas@wzsport.com.br" className="glass-panel p-10 rounded-[3rem] border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all group">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Mail className="text-primary" size={28} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 uppercase italic">E-mail Comercial</h3>
            <p className="text-slate-400 text-sm mb-6">Resposta em até 24h úteis para questões financeiras ou parcerias.</p>
            <span className="text-primary font-black tracking-tighter text-lg">vendas@wzsport.com.br</span>
          </a>

          <a href="https://wa.me/5521981496911" target="_blank" rel="noopener noreferrer" className="glass-panel p-10 rounded-[3rem] border-white/5 hover:border-green-500/40 hover:bg-green-500/5 transition-all group">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageCircle className="text-green-500" size={28} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 uppercase italic">WhatsApp Suporte</h3>
            <p className="text-slate-400 text-sm mb-6">Atendimento rápido para dúvidas técnicas e ativação de catálogo.</p>
            <span className="text-green-500 font-black tracking-tighter text-lg">21 981496911</span>
          </a>
        </div>

        <div className="mt-20 flex items-center justify-center gap-8 text-slate-500 text-xs font-black uppercase tracking-[0.2em]">
            <span className="flex items-center gap-2"><Clock size={14} /> Atendimento Segunda a Sábado</span>
            <span>09:00 às 19:00</span>
        </div>
      </div>
    </main>
  );
}
