"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, Mail, ArrowLeft, MessageCircle, Clock } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#0f172a]">
      {/* Background Decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[30%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative animate-fade-in">
        <div className="glass-panel rounded-xl p-10 flex flex-col items-center shadow-2xl border-white/5">
          {/* Logo */}
          <div className="w-16 h-16 grad-primary rounded-lg flex items-center justify-center shadow-2xl shadow-primary/40 mb-8 cursor-pointer" onClick={() => router.push("/")}>
            <Trophy className="text-white" size={32} />
          </div>

          <h1 className="text-3xl font-black mb-2 tracking-tight uppercase">Manto <span className="text-primary">PRO</span></h1>
          <p className="text-slate-400 text-sm mb-8 text-center">
            Recuperação de Acesso
          </p>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="text-primary" size={24} />
            </div>
            <h3 className="text-white font-bold mb-2">Procedimento de Segurança</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Para garantir a segurança da sua loja e dos seus dados, a recuperação de senha é realizada manualmente pela nossa equipe de suporte.
            </p>
          </div>

          <div className="w-full space-y-4">
            <a 
              href="https://wa.me/5521981496911?text=Olá, preciso recuperar o acesso da minha loja no Manto PRO." 
              target="_blank" 
              rel="noopener noreferrer"
              className="grad-primary w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all active:scale-95"
            >
              <MessageCircle size={20} /> Falar com Suporte no WhatsApp
            </a>
            
            <div className="flex items-center justify-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest pt-2">
              <Clock size={12} /> Atendimento: Seg a Sáb · 09h às 19h
            </div>
          </div>

          <div className="mt-10 flex items-center gap-2">
            <Link href="/auth/login" className="text-slate-400 hover:text-white text-sm font-bold flex items-center gap-2 transition-colors">
              <ArrowLeft size={16} /> Voltar para o Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
