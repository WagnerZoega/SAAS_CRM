'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trophy, Store, User, Mail, Lock, Phone, ArrowRight, Loader2,
  AlertCircle, CheckCircle2, Building
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    responsavel: '',
    email: '',
    telefone: '',
    password: '',
    confirmPassword: '',
  });

  const generateSlug = (nome: string) =>
    nome.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (form.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const slug = generateSlug(form.nome);
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          responsavel: form.responsavel || form.nome,
          email: form.email,
          telefone: form.telefone,
          password: form.password,
          slug,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar conta');

      // Auto-login after registration
      const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok && loginData.token) {
        localStorage.setItem('crm_token', loginData.token);
        localStorage.setItem('crm_user', JSON.stringify(loginData.empresa));
        setSuccess(true);
        setTimeout(() => router.push('/admin'), 1500);
      } else {
        router.push('/auth/login');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#0f172a]">
      {/* Background Decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute top-[60%] -left-[10%] w-[30%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-lg relative animate-fade-in">
        <div className="glass-panel rounded-xl p-10 flex flex-col items-center shadow-2xl border-white/5">
          {/* Logo */}
          <div
            className="w-16 h-16 grad-primary rounded-lg flex items-center justify-center shadow-2xl shadow-primary/40 mb-6 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <Trophy className="text-white" size={32} />
          </div>

          <h1 className="text-3xl font-black mb-1 tracking-tight uppercase">
            Criar sua <span className="text-primary">Loja</span>
          </h1>
          <p className="text-slate-400 text-sm mb-8 text-center">
            Cadastre-se e comece a vender em minutos
          </p>

          {success && (
            <div className="w-full bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-lg flex items-center gap-3 text-sm mb-6">
              <CheckCircle2 size={18} />
              <span>Conta criada! Redirecionando para o painel...</span>
            </div>
          )}

          {error && (
            <div className="w-full bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg flex items-center gap-3 text-sm mb-6">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            {/* Nome da Loja */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Nome da Loja *</label>
              <div className="relative group">
                <Store size={18} className="absolute inset-y-0 left-4 my-auto text-slate-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="text" value={form.nome} onChange={set('nome')} required
                  placeholder="Ex: Camisetas Elite FC"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-sm"
                />
              </div>
            </div>

            {/* Nome do Responsável */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Seu Nome</label>
              <div className="relative group">
                <User size={18} className="absolute inset-y-0 left-4 my-auto text-slate-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="text" value={form.responsavel} onChange={set('responsavel')}
                  placeholder="Nome do responsável"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-sm"
                />
              </div>
            </div>

            {/* Grid Email + Telefone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">E-mail *</label>
                <div className="relative group">
                  <Mail size={18} className="absolute inset-y-0 left-4 my-auto text-slate-500 group-focus-within:text-primary transition-colors" />
                  <input
                    type="email" value={form.email} onChange={set('email')} required
                    placeholder="seu@email.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">WhatsApp</label>
                <div className="relative group">
                  <Phone size={18} className="absolute inset-y-0 left-4 my-auto text-slate-500 group-focus-within:text-primary transition-colors" />
                  <input
                    type="tel" value={form.telefone} onChange={set('telefone')}
                    placeholder="5511999999999"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Senha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Senha *</label>
                <div className="relative group">
                  <Lock size={18} className="absolute inset-y-0 left-4 my-auto text-slate-500 group-focus-within:text-primary transition-colors" />
                  <input
                    type="password" value={form.password} onChange={set('password')} required minLength={6}
                    placeholder="Min. 6 caracteres"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Confirmar *</label>
                <div className="relative group">
                  <Lock size={18} className="absolute inset-y-0 left-4 my-auto text-slate-500 group-focus-within:text-primary transition-colors" />
                  <input
                    type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required
                    placeholder="Repita a senha"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Slug preview */}
            {form.nome && (
              <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-xs text-slate-400">
                <span className="text-slate-600">Sua URL: </span>
                <span className="text-primary font-mono">
                  localhost:3005/loja/<strong>{generateSlug(form.nome)}</strong>
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="grad-primary w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all active:scale-95 disabled:opacity-70 mt-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <><Building size={20} /> Criar minha Loja <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <div className="flex items-center gap-2 mt-8">
            <div className="h-px w-8 bg-white/10" />
            <p className="text-slate-500 text-sm">
              Já tem conta? <Link href="/auth/login" className="text-primary font-bold hover:underline">Fazer login</Link>
            </p>
            <div className="h-px w-8 bg-white/10" />
          </div>
        </div>
      </div>
    </main>
  );
}
