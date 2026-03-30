"use client";

import Link from "next/link";
import { 
  Trophy, 
  TrendingUp, 
  Newspaper, 
  Store, 
  Users, 
  LayoutDashboard,
  ChevronRight,
  ArrowRight,
  Menu,
  X
} from "lucide-react";
import FeedNoticias from "@/components/FeedNoticias";
import { useState, useEffect } from "react";
import GameTicker from "@/components/GameTicker";
import Modal from "@/components/Modal";
import { Mail, MessageCircle, Shield, FileText, Headset, Clock, ChevronDown } from "lucide-react";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.nav-item-with-dropdown')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeModal = () => setActiveModal(null);

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      {/* ===== NAVBAR PREMIUM (ThaiCamisas Precision) ===== */}
      <nav className="navbar">
        <Link href="/" className="navbar-logo">
          ⚽ Thai<span>Camisas</span>
          <span className="badge">ELITE</span>
        </Link>

        <ul className="nav-links hidden md:flex">
          <li>
            <Link href="/" className="active">PORTAL</Link>
          </li>
          <li><Link href="/auth/login">NOSSO CATÁLOGO</Link></li>
          <li><Link href="/auth/login">ACESSO PARCEIRO</Link></li>
        </ul>

        <div className="nav-actions">
          <Link href="/auth/register" className="btn-pedido">
            + QUERO SER PARCEIRO
          </Link>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10"
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Live Scores Ticker */}
      <GameTicker />

      {/* Discrete Drawer / Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-md animate-fade-in flex flex-col items-center justify-center p-8">
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
             <X size={24} />
          </button>
          <nav className="flex flex-col gap-6 text-center">
            <Link onClick={() => setIsMenuOpen(false)} href="/admin" className="text-3xl font-bold hover:text-primary transition-colors">Dashboard</Link>
            <Link onClick={() => setIsMenuOpen(false)} href="/auth/login" className="text-3xl font-bold hover:text-primary transition-colors">Parceiro</Link>
            <Link onClick={() => setIsMenuOpen(false)} href="/auth/register" className="text-3xl font-bold hover:text-primary transition-colors">Criar Loja</Link>
            <Link onClick={() => setIsMenuOpen(false)} href="/auth/register" className="mt-8 grad-primary px-10 py-3.5 rounded-xl text-lg font-bold">Quero ser Parceiro</Link>
          </nav>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 page-container max-w-7xl mx-auto w-full px-6 py-8">
        {/* Hero Section */}
        <section className="relative h-[400px] rounded-2xl overflow-hidden mb-16 animate-fade-in shadow-2xl border border-white/5 group">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105 duration-1000"
            style={{ backgroundImage: "url('/banner.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute bottom-12 left-12 right-12">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-black tracking-[0.2em] mb-6 backdrop-blur-md uppercase">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Portal do Revendedor Elite
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight tracking-tighter uppercase italic font-heading">
              Seu Próximo <br />
              <span className="text-[#c9a84c] italic">Império de Mantos</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-xl mb-8 leading-relaxed font-medium">
              O Manto PRO é o portal definitivo para revendedores de camisas tailandesas. 
              Notícias em tempo real, catálogo inteligente e CRM completo.
            </p>
          </div>
        </section>

        <div className="flex flex-col gap-20">
            {/* News & Releases Portal */}
            <div className="relative">
                <div className="absolute -top-24 left-0 w-full h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                <FeedNoticias />
            </div>

            {/* Platform Features - Discrete Style */}
            <section className="bg-white/[0.03] rounded-2xl p-10 md:p-16 border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] -z-10 rounded-full" />
              
              <div className="max-w-3xl">
                  <h2 className="text-2xl font-bold mb-12 tracking-tight uppercase italic">Por que usar o <br/><span className="text-primary italic">Manto PRO?</span></h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="flex flex-col gap-5">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                        <LayoutDashboard className="text-primary" size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xl mb-2">Catálogo Inteligente</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">Atualização automática com fotos em alta resolução direto da fábrica na Tailândia.</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0 border border-accent/20">
                        <Users className="text-accent" size={28} />
                      </div>
                      <div>
                        <h4 className="font-bold text-2xl mb-3">Gestão via WhatsApp</h4>
                        <p className="text-slate-400 leading-relaxed">Envio de status de pedido e rastreio automático para seus clientes em um clique.</p>
                      </div>
                    </div>
                  </div>
              </div>
            </section>
        </div>

        <footer className="mt-20 py-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-40 hover:opacity-100 transition-opacity">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">© 2024 Manto PRO - Desenvolvido para Revendedores</div>
            <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <button onClick={() => setActiveModal('termos')} className="hover:text-white transition-colors">Termos</button>
                <button onClick={() => setActiveModal('privacidade')} className="hover:text-white transition-colors">Privacidade</button>
                <button onClick={() => setActiveModal('contato')} className="hover:text-white transition-colors">Suporte</button>
            </div>
        </footer>
      </div>

      {/* Modals */}
      <Modal isOpen={activeModal === 'termos'} onClose={closeModal} title="Termos de Serviço">
        <div className="space-y-6">
          <section>
            <h3 className="text-white font-bold mb-2 uppercase italic flex items-center gap-2"><FileText size={16} /> 1. Aceitação dos Termos</h3>
            <p className="text-sm">Ao acessar e utilizar a plataforma Manto PRO, você concorda em cumprir estes termos de serviço. Nossa plataforma é uma ferramenta de gestão para revendedores.</p>
          </section>
          <section>
            <h3 className="text-white font-bold mb-2 uppercase italic flex items-center gap-2"><FileText size={16} /> 2. Licença de Uso</h3>
            <p className="text-sm">Concedemos uma licença limitada para acessar ferramenta de CRM e Catálogo. O uso é exclusivo para fins comerciais lícitos.</p>
          </section>
          <section>
            <h3 className="text-white font-bold mb-2 uppercase italic flex items-center gap-2"><FileText size={16} /> 3. Pagamentos</h3>
            <p className="text-sm">O acesso Manto PRO é liberado mediante pagamento. A falta de pagamento resultará na suspensão do acesso.</p>
          </section>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'privacidade'} onClose={closeModal} title="Privacidade & Dados">
        <div className="space-y-6">
          <section>
            <h3 className="text-white font-bold mb-2 uppercase italic flex items-center gap-2"><Shield size={16} /> 1. Coleta de Informações</h3>
            <p className="text-sm">Coletamos dados necessários para operação como nome da loja e configurações. Dados técnicos exclusivos para sua conta.</p>
          </section>
          <section>
            <h3 className="text-white font-bold mb-2 uppercase italic flex items-center gap-2"><Shield size={16} /> 2. Segurança WhatsApp</h3>
            <p className="text-sm">Não armazenamos conteúdo de conversas. Nossa integração é apenas uma ponte técnica criptografada.</p>
          </section>
          <section>
            <h3 className="text-white font-bold mb-2 uppercase italic flex items-center gap-2"><Shield size={16} /> 3. Sigilo Comercial</h3>
            <p className="text-sm">Informações de clientes e vendas são confidenciais e nunca compartilhadas com terceiros.</p>
          </section>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'contato'} onClose={closeModal} title="Suporte Manto PRO">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
          <a href="mailto:vendas@wzsport.com.br" className="p-6 rounded-lg bg-white/5 border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all group flex flex-col gap-3">
            <Mail className="text-primary" size={24} />
            <h4 className="font-bold uppercase italic text-sm">E-mail Comercial</h4>
            <span className="text-xs text-slate-400">vendas@wzsport.com.br</span>
          </a>
          <a href="https://wa.me/5521981496911" target="_blank" rel="noopener noreferrer" className="p-6 rounded-lg bg-white/5 border border-white/5 hover:border-green-500/40 hover:bg-green-500/5 transition-all group flex flex-col gap-3">
            <MessageCircle className="text-green-500" size={24} />
            <h4 className="font-bold uppercase italic text-sm">WhatsApp Suporte</h4>
            <span className="text-xs text-slate-400">21 981496911</span>
          </a>
        </div>
        <div className="mt-6 flex items-center justify-center gap-4 text-slate-500 text-[10px] font-black uppercase tracking-widest border-t border-white/5 pt-6">
          <span className="flex items-center gap-1"><Clock size={12} /> Seg a Sáb</span>
          <span>09h às 19h</span>
        </div>
      </Modal>
    </main>
  );
}
