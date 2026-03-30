'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Users, ShieldCheck, XCircle, CheckCircle, Search, Mail, ExternalLink, Activity, Calendar, Hash, CreditCard, MessageCircle, User, ArrowLeft, Save, TrendingUp, TrendingDown, DollarSign, Package, LogOut, Edit3, Trash2, ChevronDown, Plus, X, Camera } from "lucide-react";
import Modal from '@/components/Modal';
import Image from 'next/image';

export default function MasterAdminPage() {

    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPartner, setSelectedPartner] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Core Navigation State
    const [activeTab, setActiveTab] = useState('parceiros');
    const [viewingCatalogFor, setViewingCatalogFor] = useState<any>(null);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    // Catalog States
    const [catalog, setCatalog] = useState<any[]>([]);
    const [catalogSearch, setCatalogSearch] = useState('');
    const [catalogStructure, setCatalogStructure] = useState<any[]>([]);
    const [editingGlobalProduct, setEditingGlobalProduct] = useState<any>(null);

    // Catalog Management Modals
    const [isAddingTime, setIsAddingTime] = useState<any>(null);
    const [isAddingLiga, setIsAddingLiga] = useState<any>(null);
    const [isAddingCat, setIsAddingCat] = useState(false);
    const [editingTime, setEditingTime] = useState<any>(null);
    const [editingLiga, setEditingLiga] = useState<any>(null);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [confirmDelete, setConfirmDelete] = useState<any>(null);
    const [formData, setFormData] = useState({ nome: '', escudoUrl: '', categoriaId: '', ligaId: '' });

    const router = useRouter();

    const deletePartner = async (id: number) => {
        if (!confirm("🚨 TEM CERTEZA? Isso excluirá permanentemente este parceiro e todos os seus dados (clientes, pedidos, configurações).")) return;
        const token = localStorage.getItem('crm_token');
        try {
            const res = await fetch(`http://localhost:3001/api/admin/master/parceiro/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert("Parceiro excluído com sucesso!");
                fetchData();
            } else {
                alert("Erro ao excluir parceiro.");
            }
        } catch (err) { console.error(err); }
    };

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('crm_token');
            if (!token) {
                setError('Você precisa estar logado como Master.');
                window.location.href = '/auth/login';
                return;
            }
            const res = await fetch('http://localhost:3001/api/admin/master/parceiros', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCompanies(data);
            }
        } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    };

    const fetchCatalogStructure = async () => {
        try {
            const token = localStorage.getItem('crm_token');
            const res = await fetch('http://localhost:3001/api/admin/master/catalog-structure', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setCatalogStructure(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchGlobalProducts = async () => {
        try {
            const token = localStorage.getItem('crm_token');
            const res = await fetch('http://localhost:3001/api/admin/catalogo/config', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCatalog(data);
            }
        } catch (e) { console.error(e); }
    };

    const fetchCatalog = async (partnerId: number) => {
        try {
            const token = localStorage.getItem('crm_token');
            const res = await fetch(`http://localhost:3001/api/admin/master/parceiro/${partnerId}/catalogo`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setCatalog(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchData();
        fetchCatalogStructure();
        fetchGlobalProducts();
        const handleClickOutside = (event: MouseEvent) => {
            if (!(event.target as Element).closest('.nav-item-with-dropdown')) setOpenDropdown(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('crm_token');
        window.location.href = '/auth/login';
    };

    const toggleAccess = async (id: number) => {
        try {
            const token = localStorage.getItem('crm_token');
            const res = await fetch(`http://localhost:3001/api/admin/master/parceiro/${id}/toggle-acesso`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchData();
        } catch (e) { console.error(e); }
    };

    const updateCost = async (partnerId: number, produtoId: number, custo: number) => {
        try {
            const token = localStorage.getItem('crm_token');
            await fetch(`http://localhost:3001/api/admin/master/update-cost`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ empresaId: partnerId, produtoId, custoPersonalizado: custo })
            });
        } catch (e) { console.error(e); }
    };

    const updateGlobalProduct = async (data: any) => {
        try {
            const token = localStorage.getItem('crm_token');
            const res = await fetch('http://localhost:3001/api/admin/master/update-product-global', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                if (viewingCatalogFor) fetchCatalog(viewingCatalogFor.id);
                else fetchGlobalProducts();
                setEditingGlobalProduct(null);
            }
        } catch (e) { console.error(e); }
    };

    // --- Time/Liga Management ---
    const handleSaveTime = async () => {
        const token = localStorage.getItem('crm_token');
        const url = editingTime ? `http://localhost:3001/api/admin/master/time/${editingTime.id}` : 'http://localhost:3001/api/admin/master/time';
        const method = editingTime ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: formData.nome, ligaId: isAddingTime?.ligaId || editingTime?.liga_id, escudoUrl: formData.escudoUrl })
            });
            if (res.ok) {
                fetchCatalogStructure();
                setIsAddingTime(null);
                setEditingTime(null);
                setFormData({ nome: '', escudoUrl: '', categoriaId: '', ligaId: '' });
            }
        } catch (e) { console.error(e); }
    };

    const handleSaveLiga = async () => {
        const token = localStorage.getItem('crm_token');
        const url = editingLiga ? `http://localhost:3001/api/admin/master/liga/${editingLiga.id}` : 'http://localhost:3001/api/admin/master/liga';
        const method = editingLiga ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: formData.nome, categoriaId: isAddingLiga?.catId })
            });
            if (res.ok) {
                fetchCatalogStructure();
                setIsAddingLiga(null);
                setEditingLiga(null);
                setFormData({ nome: '', escudoUrl: '', categoriaId: '', ligaId: '' });
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteLiga = async (id: number) => {
        const token = localStorage.getItem('crm_token');
        try {
            const res = await fetch(`http://localhost:3001/api/admin/master/liga/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchCatalogStructure();
                setConfirmDelete(null);
            }
        } catch (e) { console.error(e); }
    };

    const handleSaveCategory = async () => {
        const token = localStorage.getItem('crm_token');
        const url = editingCategory ? `http://localhost:3001/api/admin/master/categoria/${editingCategory.id}` : 'http://localhost:3001/api/admin/master/categoria';
        const method = editingCategory ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: formData.nome })
            });
            if (res.ok) {
                fetchCatalogStructure();
                setIsAddingCat(false);
                setEditingCategory(null);
                setFormData({ nome: '', escudoUrl: '', categoriaId: '', ligaId: '' });
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteCategory = async (id: number) => {
        const token = localStorage.getItem('crm_token');
        try {
            const res = await fetch(`http://localhost:3001/api/admin/master/categoria/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchCatalogStructure();
                setConfirmDelete(null);
            }
        } catch (e) { console.error(e); }
    };

    const openPartnerDetails = (partner: any) => {
        setSelectedPartner(partner);
        setIsModalOpen(true);
    };

    const openCatalogManagement = (partner: any) => {
        setViewingCatalogFor(partner);
        fetchCatalog(partner.id);
        setIsModalOpen(false);
    };

    const filtered = companies.filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredCatalog = catalog.filter(p => p.nome?.toLowerCase().includes(catalogSearch.toLowerCase()) || p.time?.nome?.toLowerCase().includes(catalogSearch.toLowerCase()));

    if (loading) return <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center"><Activity className="text-[#c9a84c] animate-spin" size={48} /></div>;

    if (viewingCatalogFor) {
        return (
            <div className="min-h-screen bg-[#0d0d1a] p-10 text-white leading-relaxed">
                <header className="max-w-7xl mx-auto flex justify-between items-center mb-12">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setViewingCatalogFor(null)} className="p-4 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all"><ArrowLeft size={24} /></button>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Gestão de <span className="text-[#c9a84c]">Custos</span></h1>
                            <p className="text-[#c9a84c] font-black uppercase tracking-widest text-[10px] mt-2">Parceiro: {viewingCatalogFor.nome}</p>
                        </div>
                    </div>
                    <div className="relative w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input type="text" placeholder="Filtrar catálogo..." value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#c9a84c]/50 text-sm" />
                    </div>
                </header>
                <main className="max-w-7xl mx-auto bg-white/5 rounded-[14px] border border-white/10 overflow-hidden shadow-2xl">
                    <table className="w-full text-left">
                        <thead className="bg-black/40 border-b border-white/10">
                            <tr>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Modelo</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Time</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Custo Master</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Custo Especial</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredCatalog.map(prod => (
                                <tr key={prod.id} className="hover:bg-white/[0.02] transition-all group">
                                    <td className="px-8 py-6 flex items-center gap-4">
                                        <div className="w-16 h-16 bg-black rounded-xl overflow-hidden relative border border-white/10">
                                            {prod.foto_principal ? <Image src={prod.foto_principal} alt="" fill className="object-cover" /> : <Package size={24} className="m-auto text-slate-700" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black uppercase italic tracking-tighter leading-tight group-hover:text-[#c9a84c] transition-colors">{prod.nome}</span>
                                            <button onClick={() => setEditingGlobalProduct(prod)} className="text-[10px] text-slate-500 hover:text-white flex items-center gap-1 mt-1 font-bold uppercase tracking-widest"><Edit3 size={10} /> Editar Global</button>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-xs font-bold text-slate-400 uppercase">{prod.time?.nome}</td>
                                    <td className="px-8 py-6 text-slate-600 line-through text-sm italic">R$ {parseFloat(prod.preco_custo).toFixed(2)}</td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/5 w-fit focus-within:border-[#c9a84c]/50">
                                            <DollarSign size={14} className="text-[#c9a84c]" />
                                            <input 
                                                type="number" 
                                                defaultValue={prod.precos_empresas[0]?.preco_custo_personalizado || prod.preco_custo}
                                                onBlur={(e) => updateCost(viewingCatalogFor.id, prod.id, parseFloat(e.target.value))}
                                                className="bg-transparent border-none font-black text-white outline-none w-20 text-sm"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0d0d1a] font-sans text-[#e2e8f0] leading-relaxed">
            <nav className="navbar">
                <div onClick={() => setActiveTab('parceiros')} className="navbar-logo cursor-pointer font-black italic text-2xl uppercase tracking-tighter flex items-center gap-2">
                   ⚽ WZ <span className="text-[#c9a84c]">SPORT</span> <span className="text-[10px] bg-[#c9a84c] text-black px-2 py-0.5 rounded-full not-italic tracking-normal">MASTER</span>
                </div>
                <ul className="nav-links flex gap-8">
                    <li><button onClick={() => { setActiveTab('parceiros'); setViewingCatalogFor(null); }} className={`nav-link-btn ${activeTab === 'parceiros' ? 'text-[#c9a84c]' : 'text-slate-500'}`}>PARCEIROS</button></li>
                    <li><button onClick={() => { setActiveTab('catalogo'); setViewingCatalogFor(null); }} className={`nav-link-btn ${activeTab === 'catalogo' ? 'text-[#c9a84c]' : 'text-slate-500'}`}>CATÁLOGO GLOBAL</button></li>
                </ul>
                <div className="flex items-center gap-6">
                   <button onClick={handleLogout} className="bg-red-500/10 text-red-500 px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"><LogOut size={14} /> Sair</button>
                </div>
            </nav>

            <main className="p-10 max-w-[1600px] mx-auto">
                {activeTab === 'parceiros' && (
                    <div className="animate-in fade-in duration-700">
                        <header className="flex justify-between items-end mb-16">
                            <div>
                                <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none font-heading">Central <span className="text-[#c9a84c]">Parceiros</span></h1>
                                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-4 italic">Hub Multi-Tenant Manto PRO</p>
                            </div>
                            <div className="relative w-96">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input type="text" placeholder="Buscar parceiro..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-sm text-white outline-none focus:border-[#c9a84c]/50 transition-all font-bold" />
                            </div>
                        </header>
                        <div className="bg-white/[0.03] border border-white/10 rounded-[14px] overflow-hidden shadow-2xl">
                            <table className="w-full text-left">
                                <thead className="bg-black/40 border-b border-white/10 text-slate-500">
                                    <tr>
                                        <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest">Empresa</th>
                                        <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-center">Métricas</th>
                                        <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-center">SaaS Status</th>
                                        <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filtered.map(c => (
                                        <tr key={c.id} className="hover:bg-white/[0.02] transition-all group">
                                            <td className="px-10 py-10 flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center font-black text-[#c9a84c] text-2xl uppercase italic border border-white/10 group-hover:bg-[#c9a84c] group-hover:text-black transition-all cursor-pointer" onClick={() => openPartnerDetails(c)}>{c.nome.charAt(0)}</div>
                                                <div className="flex flex-col cursor-pointer" onClick={() => openPartnerDetails(c)}>
                                                   <span className="font-black text-xl text-white uppercase italic tracking-tighter leading-none group-hover:text-[#c9a84c] transition-colors">{c.nome}</span>
                                                   <span className="text-[10px] text-slate-500 font-bold mt-2 uppercase flex items-center gap-2"><Mail size={12} /> {c.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-10">
                                               <div className="flex justify-center gap-8">
                                                   <div className="flex flex-col items-center"><span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Pedidos</span><span className="font-black text-white text-lg">{c._count?.pedidos}</span></div>
                                                   <div className="flex flex-col items-center"><span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Clientes</span><span className="font-black text-white text-lg">{c._count?.clientes}</span></div>
                                               </div>
                                            </td>
                                            <td className="px-10 py-10 text-center">
                                               {c.faturamento_ativo ? 
                                                 <span className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">Ativo</span> :
                                                 <span className="px-4 py-2 bg-amber-500/10 text-amber-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-500/20">Demonstração</span>
                                               }
                                            </td>
                                            <td className="px-10 py-10 text-right">
                                               <div className="flex justify-end gap-3">
                                                  <button onClick={() => openCatalogManagement(c)} className="p-4 bg-white/5 rounded-2xl text-slate-400 hover:text-[#c9a84c] transition-all border border-white/10" title="Gerenciar Custos"><DollarSign size={18} /></button>
                                                  <button onClick={() => toggleAccess(c.id)} className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${c.faturamento_ativo ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-[#c9a84c] text-black shadow-lg shadow-[#c9a84c]/20'}`}>{c.faturamento_ativo ? 'Suspender' : 'Liberar Access'}</button>
                                                  <button onClick={() => deletePartner(c.id)} className="p-4 bg-white/5 rounded-2xl text-slate-400 hover:text-red-500 transition-all border border-white/10"><Trash2 size={18} /></button>
                                               </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'catalogo' && (
                    <div className="animate-in slide-in-from-bottom duration-700">
                        <header className="flex justify-between items-end mb-16">
                            <div>
                                <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none font-heading">Catálogo <span className="text-[#c9a84c]">Elite</span></h1>
                                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-4 italic">Gestão Estrutural de Categorias e Times</p>
                            </div>
                            <button onClick={() => setIsAddingCat(true)} className="bg-[#c9a84c] px-10 py-5 rounded-2xl text-black font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:scale-105 transition-all"><Plus size={18} /> Nova Categoria</button>
                        </header>
                        
                        <div className="grid grid-cols-1 gap-12">
                            {catalogStructure.map((cat: any) => (
                                <div key={cat.id} className="bg-white/[0.02] border border-white/10 rounded-[20px] overflow-hidden mb-12 shadow-2xl">
                                    <div className="p-8 bg-black/40 border-b border-white/10 flex justify-between items-center">
                                       <div className="flex items-center gap-4">
                                          <div className="w-1.5 h-8 bg-[#c9a84c] rounded-full shadow-[0_0_15px_#c9a84c]" />
                                          <div className="flex items-center gap-3">
                                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter font-heading">{cat.nome}</h2>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingCategory(cat); setFormData({ ...formData, nome: cat.nome }); }} className="text-slate-500 hover:text-white transition-colors"><Edit3 size={16} /></button>
                                                <button onClick={() => setConfirmDelete({ type: 'CATEGORIA', id: cat.id, name: cat.nome })} className="text-red-500/30 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                          </div>
                                       </div>
                                       <button onClick={() => setIsAddingLiga({ catId: cat.id })} className="text-[10px] font-black text-[#c9a84c] uppercase tracking-widest flex items-center gap-2 hover:underline"><Plus size={14} /> Adicionar Liga</button>
                                    </div>
                                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {cat.ligas.map((liga: any) => (
                                           <div key={liga.id} className="bg-white/[0.03] p-6 rounded-2xl border border-white/5 space-y-6">
                                              <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl">
                                                 <h3 className="text-xs font-black text-[#c9a84c] uppercase tracking-widest flex items-center gap-2">
                                                    {liga.nome} 
                                                    <div className="flex gap-1 items-center ml-2">
                                                        <Edit3 size={12} className="cursor-pointer opacity-50 hover:opacity-100" onClick={() => { setEditingLiga(liga); setFormData({ ...formData, nome: liga.nome }); }} />
                                                        <Trash2 size={12} className="cursor-pointer text-red-500/30 hover:text-red-500" onClick={() => setConfirmDelete({ type: 'LIGA', id: liga.id, name: liga.nome })} />
                                                    </div>
                                                 </h3>
                                                 <button onClick={() => setIsAddingTime({ ligaId: liga.id })} className="p-1.5 bg-[#c9a84c] text-black rounded-lg hover:scale-110 transition-transform"><Plus size={14} /></button>
                                              </div>
                                              <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2 pt-2">
                                                 {liga.times.map((time: any) => (
                                                     <div key={time.id} className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/5 transition-all hover:border-[#c9a84c]/20">
                                                        <div className="flex items-center justify-between group">
                                                           <div className="flex items-center gap-4">
                                                              <div className="w-10 h-10 rounded-xl bg-black border border-white/10 overflow-hidden relative p-1.5 shadow-lg">
                                                                 {time.escudo_url ? <Image src={time.escudo_url} alt="" fill className="object-contain p-1.5" /> : <Trophy size={16} className="m-auto text-slate-700" />}
                                                              </div>
                                                              <span className="text-[11px] font-black text-white uppercase italic tracking-tighter group-hover:text-[#c9a84c] transition-colors">{time.nome}</span>
                                                           </div>
                                                           <div className="flex gap-2">
                                                              <button onClick={() => { setEditingTime(time); setFormData({ nome: time.nome, escudoUrl: time.escudo_url || '', categoriaId: '', ligaId: '' }); }} className="text-slate-500 hover:text-white p-1 hover:bg-white/5 rounded-lg"><Edit3 size={14} /></button>
                                                              <button onClick={() => setConfirmDelete({ type: 'TIME', id: time.id, name: time.nome })} className="text-red-500/50 hover:text-red-500 p-1 hover:bg-red-500/10 rounded-lg"><Trash2 size={14} /></button>
                                                           </div>
                                                        </div>
                                                        {/* Lista de Modelos/Produtos do Time (Exibição Master) */}
                                                        <div className="pl-6 border-l-2 border-[#c9a84c]/10 space-y-1.5 mt-2">
                                                           {catalog.filter((p: any) => p.time_id === time.id).map((p: any) => (
                                                              <div key={p.id} className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg group/prod hover:bg-white/10 transition-all border border-transparent hover:border-white/10">
                                                                 <div className="flex items-center gap-3">
                                                                    <Package size={12} className="text-[#c9a84c]/40 group-hover/prod:text-[#c9a84c]" />
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase italic truncate max-w-[150px] group-hover/prod:text-white transition-colors">{p.nome}</span>
                                                                 </div>
                                                                 <div className="flex gap-2">
                                                                    <button onClick={() => setConfirmDelete({ type: 'PRODUTO', id: p.id, name: p.nome })} className="text-red-500/40 hover:text-red-500 p-1 rounded hover:bg-red-500/10"><Trash2 size={12} /></button>
                                                                 </div>
                                                              </div>
                                                           ))}
                                                           {catalog.filter((p: any) => p.time_id === time.id).length === 0 && (
                                                              <span className="text-[8px] font-bold text-slate-600 uppercase italic pl-2">Vazio</span>
                                                           )}
                                                        </div>
                                                     </div>
                                                 ))}
                                              </div>
                                           </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* MODAL: selectedPartner Details */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Protocolo do Parceiro">
                {selectedPartner && (
                    <div className="space-y-8 p-4 italic">
                        <div className="flex items-center gap-6">
                           <div className="w-20 h-20 rounded-3xl bg-[#c9a84c] flex items-center justify-center text-black font-black text-4xl italic">{selectedPartner.nome.charAt(0)}</div>
                           <div>
                              <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">{selectedPartner.nome}</h3>
                              <p className="text-[#c9a84c] font-bold uppercase text-[10px] tracking-widest mt-2">{selectedPartner.email}</p>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Responsável</span>
                              <span className="text-white font-black text-lg flex items-center gap-3 italic"><User size={20} className="text-[#c9a84c]"/> {selectedPartner.responsavel || 'Pendente'}</span>
                           </div>
                           <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">WhatsApp</span>
                              <span className="text-white font-black text-lg flex items-center gap-3 italic"><MessageCircle size={20} className="text-[#c9a84c]"/> {selectedPartner.telefone || 'Pendente'}</span>
                           </div>
                        </div>
                        <button onClick={() => toggleAccess(selectedPartner.id)} className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${selectedPartner.faturamento_ativo ? 'bg-amber-500 text-white' : 'bg-[#c9a84c] text-black shadow-lg shadow-[#c9a84c]/20'}`}>{selectedPartner.faturamento_ativo ? 'Suspender SaaS' : 'Liberar SaaS Elite'}</button>
                    </div>
                )}
            </Modal>

            {/* MODALS GESTÃO CATÁLOGO */}
            {(isAddingTime || editingTime) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#0d0d1a]/90 backdrop-blur-sm" onClick={() => { setIsAddingTime(null); setEditingTime(null); }} />
                    <div className="bg-[#111827] w-full max-w-md rounded-3xl border border-[#c9a84c]/20 shadow-3xl relative p-12 space-y-8 animate-in zoom-in">
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{editingTime ? 'Editar' : 'Novo'} <span className="text-[#c9a84c]">Time</span></h3>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Nome do Time</label>
                            <input type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#c9a84c]/50 text-white font-bold" />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Logo/Escudo (URL)</label>
                            <input type="text" value={formData.escudoUrl} onChange={(e) => setFormData({...formData, escudoUrl: e.target.value})} className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#c9a84c]/50 text-white text-xs font-mono" />
                        </div>
                        <button onClick={handleSaveTime} className="w-full bg-[#c9a84c] py-6 rounded-2xl text-black font-black uppercase text-xs tracking-widest shadow-2xl shadow-[#c9a84c]/20 hover:scale-[1.02] transition-all">Efetivar Protocolo</button>
                    </div>
                </div>
            )}

            {confirmDelete && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setConfirmDelete(null)} />
                    <div className="bg-[#1a1a2e] w-full max-w-sm rounded-[32px] border border-red-500/20 shadow-3xl relative p-10 space-y-8 animate-in zoom-in">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                            <Trash2 size={32} className="text-red-500" />
                        </div>
                        <div className="text-center space-y-3">
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Confirmar <span className="text-red-500 font-black">Exclusão</span></h3>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                                Você está prestes a excluir permanentemente <br/> 
                                <span className="text-white">[{confirmDelete.type}] {confirmDelete.name}</span> <br/>
                                <span className="text-red-400/60 mt-2 block italic">Ação irreversível com impacto global.</span>
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDelete(null)} className="flex-1 py-4 bg-white/5 rounded-2xl text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all border border-white/5">Abortar</button>
                            <button onClick={async () => {
                                if (confirmDelete.type === 'CATEGORIA') handleDeleteCategory(confirmDelete.id);
                                else if (confirmDelete.type === 'LIGA') handleDeleteLiga(confirmDelete.id);
                                else if (confirmDelete.type === 'TIME') {
                                    const token = localStorage.getItem('crm_token');
                                    const res = await fetch(`http://localhost:3001/api/admin/catalogo/time/${confirmDelete.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                                    if (res.ok) { fetchCatalogStructure(); fetchGlobalProducts(); setConfirmDelete(null); }
                                }
                                else if (confirmDelete.type === 'PRODUTO') {
                                    const token = localStorage.getItem('crm_token');
                                    const res = await fetch(`http://localhost:3001/api/admin/catalogo/produto/${confirmDelete.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                                    if (res.ok) { fetchGlobalProducts(); setConfirmDelete(null); }
                                }
                            }} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20 hover:scale-105 transition-all">EFETIVAR LIXEIRA</button>
                        </div>
                    </div>
                </div>
            )}

            {(isAddingLiga || editingLiga) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#0d0d1a]/90 backdrop-blur-sm" onClick={() => { setIsAddingLiga(null); setEditingLiga(null); }} />
                    <div className="bg-[#111827] w-full max-w-md rounded-3xl border border-[#c9a84c]/20 shadow-3xl relative p-12 space-y-8 animate-in zoom-in">
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{editingLiga ? 'Editar' : 'Nova'} <span className="text-[#c9a84c]">Liga</span></h3>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Nome da Liga</label>
                            <input type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#c9a84c]/50 text-white font-bold" />
                        </div>
                        <button onClick={handleSaveLiga} className="w-full bg-[#c9a84c] py-6 rounded-2xl text-black font-black uppercase text-xs tracking-widest shadow-2xl shadow-[#c9a84c]/20 hover:scale-[1.02] transition-all">Configurar Liga</button>
                    </div>
                </div>
            )}

            {(isAddingCat || editingCategory) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#0d0d1a]/90 backdrop-blur-sm" onClick={() => { setIsAddingCat(false); setEditingCategory(null); }} />
                    <div className="bg-[#111827] w-full max-w-md rounded-3xl border border-[#c9a84c]/20 shadow-3xl relative p-12 space-y-8 animate-in zoom-in">
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{editingCategory ? 'Editar' : 'Nova'} <span className="text-[#c9a84c]">Categoria</span></h3>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Nome da Categoria</label>
                            <input type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#c9a84c]/50 text-white font-bold" />
                        </div>
                        <button onClick={handleSaveCategory} className="w-full bg-[#c9a84c] py-6 rounded-2xl text-black font-black uppercase text-xs tracking-widest shadow-2xl shadow-[#c9a84c]/20 hover:scale-[1.02] transition-all">{editingCategory ? 'Efetivar Protocolo' : 'Criar Categoria'}</button>
                    </div>
                </div>
            )}

            {editingGlobalProduct && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#0d0d1a]/90 backdrop-blur-sm" onClick={() => setEditingGlobalProduct(null)} />
                    <div className="bg-[#111827] w-full max-w-lg rounded-3xl border border-[#c9a84c]/20 shadow-3xl relative overflow-hidden flex flex-col animate-in zoom-in">
                        <div className="p-10 border-b border-white/5 bg-black/20 flex justify-between items-center">
                           <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Editar Produto <span className="text-[#c9a84c]">Global</span></h3>
                           <button onClick={() => setEditingGlobalProduct(null)} className="text-slate-500 hover:text-white"><X size={24} /></button>
                        </div>
                        <div className="p-10 space-y-8">
                             <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Nome do Produto</label>
                                <input type="text" value={editingGlobalProduct.nome} onChange={(e) => setEditingGlobalProduct({...editingGlobalProduct, nome: e.target.value})} className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#c9a84c]/50 text-white font-bold" />
                             </div>
                             <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Custo Base Master (R$)</label>
                                <input type="number" value={editingGlobalProduct.preco_custo} onChange={(e) => setEditingGlobalProduct({...editingGlobalProduct, preco_custo: e.target.value})} className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#c9a84c]/50 text-[#c9a84c] font-black text-xl" />
                             </div>
                             <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Descrição Estrutural</label>
                                <textarea rows={2} value={editingGlobalProduct.descricao || ''} onChange={(e) => setEditingGlobalProduct({...editingGlobalProduct, descricao: e.target.value})} className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#c9a84c]/50 text-slate-300 text-sm" />
                             </div>
                             <button onClick={() => updateGlobalProduct({ id: editingGlobalProduct.id, nome: editingGlobalProduct.nome, precoCusto: editingGlobalProduct.preco_custo, descricao: editingGlobalProduct.descricao, fotoPrincipal: editingGlobalProduct.foto_principal })} className="w-full bg-[#c9a84c] py-6 rounded-2xl text-black font-black uppercase text-xs tracking-widest shadow-2xl shadow-[#c9a84c]/20 hover:scale-[1.02] transition-all font-heading italic">Salvar Alterações</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .nav-link-btn { font-size: 10px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; transition: all 0.3s; }
                .nav-link-btn:hover { color: #c9a84c; opacity: 0.8; }
                .navbar { background: rgba(13, 13, 26, 0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(201, 168, 76, 0.1); padding: 1.5rem 2.5rem; display: flex; justify-content: space-between; items-center; position: sticky; top: 0; z-index: 50; }
                .shadow-3xl { box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8); }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(201, 168, 76, 0.2); border-radius: 10px; }
            `}</style>
        </div>
    );
}
