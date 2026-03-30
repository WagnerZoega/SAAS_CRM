'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy, Store, Users, Activity, LogOut, Loader2, Package, Calendar, Search,
  RefreshCcw, CheckCircle2, ChevronRight, Filter, DollarSign, Eye, EyeOff,
  Save, TrendingUp, X, Image as ImageIcon, Copy, Link as LinkIcon,
  Settings, User, MessageCircle, MapPin, Edit3, Plus, Trash2, ChevronLeft,
  Camera, Hash, Instagram, Palette, Globe, CreditCard, ChevronDown,
  Send, Truck, Tag, Clock, AlertCircle, Phone, ArrowRight, Shield, Download
} from 'lucide-react';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3005';

export default function AdminPage() {

  const [activeTab, setActiveTab] = useState('dashboard');

  const [categoryFilter, setCategoryFilter] = useState('');

  const [user, setUser] = useState<any>(null);

  const [dashboardData, setDashboardData] = useState<any>(null);

  const [catalog, setCatalog] = useState<any[]>([]);

  const [ligas, setLigas] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [updating, setUpdating] = useState(false);

  const router = useRouter();



  const [globalMargin, setGlobalMargin] = useState(100);

  const [searchTerm, setSearchTerm] = useState("");

  const [copiedLink, setCopiedLink] = useState(false);



  // Modals

  const [selectedProductPhotos, setSelectedProductPhotos] = useState<any>(null);

  const [editingProduct, setEditingProduct] = useState<any>(null);

  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  const [isAddingOrder, setIsAddingOrder] = useState(false);

  const [newCustomer, setNewCustomer] = useState({ nome: '', telefone: '', email: '', cidade: '', estado: '' });

  const [newProduct, setNewProduct] = useState({ nome: '', timeNome: '', ligaId: '', precoCusto: 0, fotoPrincipal: '', tipo: 'torcedor' });

  const [newOrder, setNewOrder] = useState({ clienteId: '', items: [] as any[] });



  // Profile Edit State

  const [profileForm, setProfileForm] = useState<any>({

    nome: '', responsavel: '', telefone: '', pix_key: '', instagram: '', logo_url: '', bio: '', cor_primaria: '#3b82f6'

  });



  const [waStatus, setWaStatus] = useState<any>(null);

  const [qrCode, setQrCode] = useState<string | null>(null);



  // Pedidos State

  const [pedidos, setPedidos] = useState<any[]>([]);

  const [selectedPedido, setSelectedPedido] = useState<any>(null);

  const [sendingMessage, setSendingMessage] = useState(false);

  const [customMessage, setCustomMessage] = useState('');

  const [pedidoFilter, setPedidoFilter] = useState('todos');

  const [rastreioInput, setRastreioInput] = useState('');



  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<string[]>([]);
  const [expandedTeams, setExpandedTeams] = useState<string[]>([]);
  const [expandedModels, setExpandedModels] = useState<string[]>([]);

  // Clientes State
  const [clientes, setClientes] = useState<any[]>([]);
  const [clienteSearch, setClienteSearch] = useState('');
  const [editingCliente, setEditingCliente] = useState<any>(null);
  const [clienteForm, setClienteForm] = useState<any>({ nome: '', telefone: '', email: '', cpf: '', cidade: '', estado: '', cep: '' });
  const [savingCliente, setSavingCliente] = useState(false);
  const [clienteSuccess, setClienteSuccess] = useState('');
  const [clienteError, setClienteError] = useState('');

  useEffect(() => {

    const handleClickOutside = (event: MouseEvent) => {

      if (!(event.target as Element).closest('.nav-item-with-dropdown')) {

        setOpenDropdown(null);

      }

    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);

  }, []);



  const toggleCat = (cat: string) => setExpandedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  const toggleTeam = (team: string) => setExpandedTeams(prev => prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]);

  const toggleModel = (id: string) => setExpandedModels(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);



  const getModelLabel = (name: string) => {

    const t = name.toUpperCase();

    if (t.includes('PLAYER') || t.includes('JOGADOR')) return 'MODELO JOGADOR';

    if (t.includes('WOMEN') || t.includes('FEMININA') || t.includes('CROP TOP')) return 'MODELO FEMININO';

    if (t.includes('KIDS') || t.includes('INFANTIL')) return 'MODELO INFANTIL';

    return 'MODELO TORCEDOR';

  };



  const fetchData = async () => {

    const token = localStorage.getItem('crm_token');

    if (!token) {

      router.push('/auth/login');

      return;

    }



    try {

      const headers = { 'Authorization': `Bearer ${token}` };

      const resUser = await fetch(`${API_URL}/api/auth/me`, { headers });

      let currentUser: any = null;

      if (resUser.ok) {

        currentUser = await resUser.json();

        setUser(currentUser);

        setProfileForm({

          nome: currentUser.nome || '',

          responsavel: currentUser.responsavel || '',

          telefone: currentUser.telefone || '',

          pix_key: currentUser.pix_key || '',

          instagram: currentUser.instagram || '',

          logo_url: currentUser.logo_url || '',

          bio: currentUser.bio || '',

          cor_primaria: currentUser.cor_primaria || '#3b82f6'

        });

      }



      const resDash = await fetch(`${API_URL}/api/auth/me/dashboard`, { headers });

      if (resDash.ok) setDashboardData(await resDash.json());



      const resCat = await fetch(`${API_URL}/api/admin/catalogo/config`, { headers, cache: 'no-store' });

      if (resCat.ok) setCatalog(await resCat.json());



      const resLigas = await fetch(`${API_URL}/api/admin/catalogo/ligas`, { headers, cache: 'no-store' });

      if (resLigas.ok) setLigas(await resLigas.json());



      // Load pedidos

      if (currentUser?.id) {

        const resPedidos = await fetch(`${API_URL}/api/pedidos/list/${currentUser.id}`, { headers });

        if (resPedidos.ok) setPedidos(await resPedidos.json());

        // Load clientes
        const resClientes = await fetch(`${API_URL}/api/clientes/list`, { headers });
        if (resClientes.ok) setClientes(await resClientes.json());
      }



    } catch (err) {

      console.error('Erro ao carregar dados:', err);

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    fetchData();

  }, [router]);



  const copyStoreLink = () => {
    const link = `${STORE_URL}/loja/${user?.slug}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // ============================================================
  // Clientes CRUD
  // ============================================================
  const fetchClientes = async () => {
    const token = localStorage.getItem('crm_token');
    const res = await fetch(`${API_URL}/api/clientes/list`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setClientes(await res.json());
  };

  const saveCliente = async () => {
    const token = localStorage.getItem('crm_token');
    setSavingCliente(true);
    setClienteError('');
    try {
      const isEdit = !!editingCliente?.id;
      const url = isEdit ? `${API_URL}/api/clientes/${editingCliente.id}` : `${API_URL}/api/clientes/create`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(clienteForm)
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erro ao salvar');
      }
      setClienteSuccess(isEdit ? 'Cliente atualizado!' : 'Cliente criado com sucesso!');
      setEditingCliente(null);
      setClienteForm({ nome: '', telefone: '', email: '', cpf: '', cidade: '', estado: '', cep: '' });
      await fetchClientes();
      setTimeout(() => setClienteSuccess(''), 3000);
    } catch (err: any) {
      setClienteError(err.message);
    } finally {
      setSavingCliente(false);
    }
  };

  const deleteCliente = async (id: number) => {
    if (!confirm('Excluir este cliente? Esta ação não pode ser desfeita.')) return;
    const token = localStorage.getItem('crm_token');
    const res = await fetch(`${API_URL}/api/clientes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setClienteSuccess('Cliente excluído.');
      await fetchClientes();
      setTimeout(() => setClienteSuccess(''), 2000);
    }
  };

  // ============================================================
  // Pedidos - delete/export
  // ============================================================
  const deletePedido = async (id: number) => {
    if (!confirm('Excluir este pedido? Esta ação não pode ser desfeita.')) return;
    const token = localStorage.getItem('crm_token');
    const res = await fetch(`${API_URL}/api/pedidos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setSelectedPedido(null);
      await fetchData();
    }
  };

  const exportPedidos = () => {
    if (!user?.id) return;
    window.open(`${API_URL}/api/pedidos/export/${user.id}`, '_blank');
  };


  const updateProduct = async (data: any) => {

    const token = localStorage.getItem('crm_token');

    try {

      const res = await fetch(`${API_URL}/api/admin/catalogo/update`, {

        method: 'POST',

        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },

        body: JSON.stringify(data)

      });

      if (res.ok) {

        setEditingProduct(null);

        await fetchData();

      } else {

        alert("Falha ao salvar. Verifique se os dados estão corretos.");

      }

    } catch (err) {
      console.error(err);
      alert("Erro de conexão ao salvar.");
    }
  };

  const deleteProduct = async (id: number) => {
    if (!window.confirm("⚠️ ATENÇÃO: Isso excluirá o produto GLOBALMENTE para todos os parceiros. Deseja continuar?")) return;
    const token = localStorage.getItem('crm_token');
    try {
      const res = await fetch(`${API_URL}/api/admin/catalogo/produto/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) await fetchData();
      else alert("Falha ao excluir produto.");
    } catch (err) {
      alert("Erro ao conectar ao servidor.");
    }
  };

  const deleteTeam = async (id: number) => {
    if (!window.confirm("🚨 PERIGO: Isso excluirá o TIME e TODOS os seus produtos globalmente. Confirmar?")) return;
    const token = localStorage.getItem('crm_token');
    try {
      const res = await fetch(`${API_URL}/api/admin/catalogo/time/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) await fetchData();
      else alert("Falha ao excluir time.");
    } catch (err) {
      alert("Erro ao conectar ao servidor.");
    }
  };



  const updateProfile = async () => {

    const token = localStorage.getItem('crm_token');

    setUpdating(true);

    try {

      const res = await fetch(`${API_URL}/api/auth/me/update`, {

        method: 'POST',

        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },

        body: JSON.stringify(profileForm)

      });

      if (res.ok) {

        alert("Perfil atualizado com sucesso!");

        fetchData();

      }

    } catch (err) { alert("Erro ao atualizar perfil"); }

    finally { setUpdating(false); }

  };



  const createCustomProduct = async () => {

    const token = localStorage.getItem('crm_token');

    try {
      const res = await fetch(`${API_URL}/api/admin/catalogo/create-custom`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });

      if (res.ok) {

        fetchData();

        setIsAddingProduct(false);

      }

    } catch (err) { alert("Erro ao criar"); }

  };



  const updateProductPhotos = async (produtoId: number, fotos: string[]) => {

    const token = localStorage.getItem('crm_token');

    try {
      await fetch(`${API_URL}/api/admin/catalogo/update-photos`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ produtoId, fotos })
      });

      fetchData();

      setSelectedProductPhotos(null);

    } catch (err) { alert("Erro ao atualizar fotos"); }

    finally { setUpdating(false); }

  };



  const createCustomer = async () => {

    const token = localStorage.getItem('crm_token');

    try {
      const res = await fetch(`${API_URL}/api/clientes/create`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: newCustomer.nome,
          telefone: newCustomer.telefone,
          email: newCustomer.email,
          endereco: { cidade: newCustomer.cidade, estado: newCustomer.estado }
        })
      });

      if (res.ok) {

        setIsAddingCustomer(false);

        setNewCustomer({ nome: '', telefone: '', email: '', cidade: '', estado: '' });

        fetchData();

      }

    } catch (err) { alert("Erro ao cadastrar cliente"); }

  };

  const createOrder = async () => {
    const token = localStorage.getItem('crm_token');
    if (!newOrder.clienteId) return alert("Selecione um cliente");
    try {
      const res = await fetch(`${API_URL}/api/pedidos/create-manual`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: user.id,
          clienteId: parseInt(newOrder.clienteId),
          items: newOrder.items,
          total: 0
        })
      });
      if (res.ok) {
        setIsAddingOrder(false);
        setNewOrder({ clienteId: '', items: [] });
        await fetchData();
      } else {
        const d = await res.json();
        alert(d.error || "Erro ao gerar pedido");
      }
    } catch (err) { alert("Erro de conexão"); }
  };



  const connectWhatsApp = async () => {

    const token = localStorage.getItem('crm_token');

    try {

      const res = await fetch(`${API_URL}/api/whatsapp/connect/${user.id}`, {

        method: 'POST',

        headers: { 'Authorization': `Bearer ${token}` }

      });

      const data = await res.json();

      if (data.qrcode) setQrCode(data.qrcode);

    } catch (err) { alert("Erro ao conectar WhatsApp"); }

  };



  const checkWhatsAppStatus = async () => {

    if (!user?.slug) return;

    try {

      const res = await fetch(`${API_URL}/api/whatsapp/status/${user.slug}`);

      const data = await res.json();

      setWaStatus(data);

    } catch (err) { }

  };



  const updatePedidoStatus = async (pedidoId: number, newStatus: string, rastreio?: string) => {

    const token = localStorage.getItem('crm_token');

    try {

      const body: any = { status: newStatus, empresaId: user.id };

      if (rastreio) body.rastreio_codigo = rastreio;

      const res = await fetch(`${API_URL}/api/pedidos/status/${pedidoId}`, {

        method: 'PUT',

        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },

        body: JSON.stringify(body)

      });

      if (res.ok) {

        const data = await res.json();

        setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, status: newStatus, rastreio_codigo: rastreio || p.rastreio_codigo } : p));

        if (selectedPedido?.id === pedidoId) setSelectedPedido({ ...selectedPedido, status: newStatus, rastreio_codigo: rastreio || selectedPedido.rastreio_codigo });

        alert(`Status atualizado para: ${newStatus.toUpperCase()}. Mensagem WhatsApp enviada ao cliente!`);

        await fetchData();

      }

    } catch (err) { alert('Erro ao atualizar status'); }

  };



  const sendDirectMessage = async (telefone: string, message: string) => {

    if (!message.trim()) return;

    setSendingMessage(true);

    try {
      const res = await fetch(`${API_URL}/api/pedidos/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId: user.id, clienteTelefone: telefone, message })
      });

      if (res.ok) { alert('Mensagem enviada via WhatsApp!'); setCustomMessage(''); }

      else alert('Falha no envio. Verifique se o WhatsApp está conectado.');

    } catch (err) { alert('Erro de conexão'); }

    finally { setSendingMessage(false); }

  };



  const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {

    pendente: { label: 'Pendente', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: Clock },

    pago: { label: 'Pago', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: DollarSign },

    separacao: { label: 'Em Separação', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Package },

    etiqueta_gerada: { label: 'Etiqueta Gerada', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', icon: Tag },

    enviado: { label: 'Enviado', color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-200', icon: Truck },

    entregue: { label: 'Entregue', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: CheckCircle2 },

    cancelado: { label: 'Cancelado', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: AlertCircle },

  };



  const STATUS_FLOW = ['pendente', 'pago', 'separacao', 'etiqueta_gerada', 'enviado', 'entregue'];

  const getNextStatus = (current: string) => {

    const idx = STATUS_FLOW.indexOf(current);

    return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;

  };



  const filteredPedidos = pedidoFilter === 'todos' ? pedidos : pedidos.filter(p => p.status === pedidoFilter);



  useEffect(() => {

    if (activeTab === 'whatsapp') {

      checkWhatsAppStatus();

      const interval = setInterval(checkWhatsAppStatus, 10000);

      return () => clearInterval(interval);

    }

  }, [activeTab]);



  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isNew: boolean) => {

    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {

      if (isNew) {

        setNewProduct({ ...newProduct, fotoPrincipal: reader.result as string });

      } else {

        setEditingProduct({ ...editingProduct, foto_principal_customizada: reader.result as string });

      }

    };

    reader.readAsDataURL(file);

  };



  const handleLogout = () => {

    localStorage.removeItem('crm_token');

    router.push('/auth/login');

  };





  if (loading) return (

    <div className="min-h-screen bg-slate-900 flex items-center justify-center">

      <Loader2 className="text-primary animate-spin" size={48} />

    </div>

  );



  const filteredCatalog = catalog.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.time.nome.toLowerCase().includes(searchTerm.toLowerCase());

    const pCat = (p.time?.liga?.categoria?.nome || '').toUpperCase();
    const fCat = categoryFilter.toUpperCase();

    // Filtro flexível: Brasileiro == Brasileirão, etc.
    const matchesCategory = categoryFilter === '' || 
      pCat === fCat ||
      (fCat === 'BRASILEIRO' && pCat === 'BRASILEIRÃO') ||
      (fCat === 'BRASILEIRÃO' && pCat === 'BRASILEIRO');

    return matchesSearch && matchesCategory;
  });



  return (

    <div className="min-h-screen bg-[#0d0d1a] font-sans text-[#e2e8f0] selection:bg-[#c9a84c]/30 selection:text-[#c9a84c]">



      {/* ===== NAVBAR PREMIUM (ThaiCamisas Precision) ===== */}

      <nav className="navbar">

        <Link href="/admin" className="navbar-logo">

          ⚽ Thai<span>Camisas</span>

          <span className="badge">REVENDA</span>

        </Link>



        <ul className="nav-links">

          <li>

            <button

              onClick={() => { setActiveTab('dashboard'); setCategoryFilter(''); setOpenDropdown(null); }}

              className={activeTab === 'dashboard' ? 'active' : ''}

            >

              DASHBOARD

            </button>

          </li>

          <li className="nav-item-with-dropdown relative">

            <button

              onClick={() => setOpenDropdown(openDropdown === 'catalogo' ? null : 'catalogo')}

              className={(activeTab === 'produtos' || openDropdown === 'catalogo') ? 'active' : ''}

            >

              CATÁLOGO <ChevronDown size={14} className={`transition-transform duration-300 ${openDropdown === 'catalogo' ? 'rotate-180' : ''}`} />

            </button>

            <div className={`dropdown ${openDropdown === 'catalogo' ? 'show' : ''}`}>

              <button onClick={() => { setActiveTab('produtos'); setCategoryFilter('BRASILEIRO'); setOpenDropdown(null); }} className="w-full text-left">🇧🇷 Brasileiro</button>

              <button onClick={() => { setActiveTab('produtos'); setCategoryFilter('EUROPEUS'); setOpenDropdown(null); }} className="w-full text-left">🇪🇺 Europeus</button>

              <button onClick={() => { setActiveTab('produtos'); setCategoryFilter('PREMIER LEAGUE'); setOpenDropdown(null); }} className="w-full text-left">🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League</button>

              <button onClick={() => { setActiveTab('produtos'); setCategoryFilter('SELEÇÕES'); setOpenDropdown(null); }} className="w-full text-left">🌍 SELEÇÕES</button>

              <button onClick={() => { setActiveTab('produtos'); setCategoryFilter(''); setOpenDropdown(null); }} className="w-full text-left">📦 Ver Todos</button>

            </div>

          </li>

          <li className="nav-item-with-dropdown relative">

            <button

              onClick={() => setOpenDropdown(openDropdown === 'pedidos' ? null : 'pedidos')}

              className={(activeTab === 'pedidos' || openDropdown === 'pedidos') ? 'active' : ''}

            >

              PEDIDOS <span className="notification-dot ml-2"></span> <ChevronDown size={14} className={`ml-1 transition-transform duration-300 ${openDropdown === 'pedidos' ? 'rotate-180' : ''}`} />

            </button>

            <div className={`dropdown ${openDropdown === 'pedidos' ? 'show' : ''}`}>

              <button onClick={() => { setIsAddingOrder(true); setOpenDropdown(null); }} className="w-full text-left">🛍️ Novo Pedido</button>

              <button onClick={() => { setActiveTab('pedidos'); setOpenDropdown(null); }} className="w-full text-left">📋 Meus Pedidos</button>

            </div>

          </li>

          <li><button onClick={() => { setActiveTab('whatsapp'); setOpenDropdown(null); }} className={activeTab === 'whatsapp' ? 'active' : ''}>WHATSAPP API</button></li>

          <li><button onClick={() => { setActiveTab('clientes'); setOpenDropdown(null); }} className={activeTab === 'clientes' ? 'active' : ''}>CLIENTES</button></li>

          <li><button onClick={() => { setActiveTab('perfil'); setOpenDropdown(null); }} className={activeTab === 'perfil' ? 'active' : ''}>CONFIGURAÇÕES</button></li>

        </ul>



        <div className="mt-auto pt-10 border-t border-white/5 space-y-4">

          <button onClick={handleLogout} className="flex items-center gap-4 px-6 py-4 w-full text-left text-xs font-black text-rose-500 hover:bg-rose-500/10 transition-all rounded-xl uppercase tracking-widest">

            <LogOut size={18} /> Sair da Operação

          </button>

        </div>



        <div className="nav-actions">

          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg border border-white/10">

            <User size={14} className="text-[#c9a84c]" />

            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{user?.nome?.split(' ')[0]}</span>

          </div>

          <button onClick={() => setIsAddingProduct(true)} className="btn-pedido">

            + Novo Manto

          </button>

        </div>

      </nav>



      <main className="p-10 max-w-[1600px] mx-auto">



        {/* Tab: Configurações / Perfil */}

        {activeTab === 'perfil' && (

          <div className="space-y-16 animate-in slide-in-from-right duration-700">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">



              {/* Visual Preview */}

              <div className="space-y-10">

                <div className="bg-[#111827]/60 backdrop-blur-3xl p-12 rounded-[14px] text-white relative overflow-hidden shadow-3xl border border-[#c9a84c]/20 group">

                  <div className="absolute -top-10 -right-10 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000"><Globe size={160} /></div>

                  <div className="relative z-10 flex flex-col items-center text-center">

                    <div className="w-40 h-40 bg-[#0d0d1a] rounded-[14px] mb-8 flex items-center justify-center overflow-hidden border-4 border-[#c9a84c] shadow-2xl relative">

                      {profileForm.logo_url ? <Image src={profileForm.logo_url} alt="" fill className="object-cover" /> : <Camera size={50} className="text-[#c9a84c]/20" />}

                    </div>

                    <h3 className="text-3xl font-black uppercase italic tracking-tighter font-heading">{profileForm.nome || 'Elite Store'}</h3>

                    <p className="text-[10px] font-black text-[#c9a84c] uppercase tracking-[0.4em] mt-3 italic">Protocolo: loja/{user?.slug}</p>

                  </div>

                </div>



                <div className="bg-[#111827]/40 backdrop-blur-2xl p-10 rounded-[14px] border border-[#c9a84c]/10 shadow-2xl space-y-8">

                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Identidade Visual</h4>

                  <div>

                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-4 tracking-widest">Tom de Destaque</label>

                    <div className="flex items-center gap-5 bg-[#0d0d1a] p-4 rounded-2xl border border-white/5">

                      <input type="color" value={profileForm.cor_primaria} onChange={(e) => setProfileForm({ ...profileForm, cor_primaria: e.target.value })} className="w-14 h-14 rounded-xl bg-transparent border-none cursor-pointer" />

                      <span className="font-mono text-sm font-black text-[#c9a84c] uppercase tracking-widest">{profileForm.cor_primaria}</span>

                    </div>

                  </div>

                  <div>

                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-4 tracking-widest">Asset Digital (URL Logo)</label>

                    <div className="flex items-center gap-4 bg-[#0d0d1a] p-5 rounded-2xl border border-white/5 focus-within:border-[#c9a84c]/40 transition-all">

                      <ImageIcon size={20} className="text-[#c9a84c]" />

                      <input type="text" value={profileForm.logo_url} onChange={(e) => setProfileForm({ ...profileForm, logo_url: e.target.value })} placeholder="https://..." className="bg-transparent flex-1 outline-none text-xs font-bold text-white italic" />

                    </div>

                  </div>

                </div>

              </div>



              {/* Form Data */}

              <div className="lg:col-span-2 space-y-16">

                <div className="bg-[#111827]/40 backdrop-blur-3xl p-16 rounded-[14px] border border-[#c9a84c]/10 shadow-3xl">

                  <div className="flex items-center gap-5 mb-14">

                    <div className="w-3 h-12 bg-[#c9a84c] rounded-full shadow-[0_0_20px_#c9a84c]" />

                    <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter font-heading">Credenciais de <span className="text-[#c9a84c]">Elite</span></h3>

                  </div>



                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                    <div className="space-y-3">

                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Nome Corporativo</label>

                      <div className="flex items-center gap-5 bg-[#0d0d1a] p-6 rounded-[14px] border border-white/5 focus-within:border-[#c9a84c]/40 transition-all group shadow-inner">

                        <Store size={22} className="text-[#c9a84c]/40 group-focus-within:text-[#c9a84c]" />

                        <input type="text" value={profileForm.nome} onChange={(e) => setProfileForm({ ...profileForm, nome: e.target.value })} className="bg-transparent flex-1 outline-none font-black text-xl text-white uppercase italic tracking-tighter" />

                      </div>

                    </div>

                    <div className="space-y-3">

                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Operador Responsável</label>

                      <div className="flex items-center gap-5 bg-[#0d0d1a] p-6 rounded-[14px] border border-white/5 focus-within:border-[#c9a84c]/40 transition-all group shadow-inner">

                        <User size={22} className="text-[#c9a84c]/40 group-focus-within:text-[#c9a84c]" />

                        <input type="text" value={profileForm.responsavel} onChange={(e) => setProfileForm({ ...profileForm, responsavel: e.target.value })} className="bg-transparent flex-1 outline-none font-black text-xl text-white uppercase italic tracking-tighter" />

                      </div>

                    </div>

                    <div className="space-y-3">

                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Canal WhatsApp</label>

                      <div className="flex items-center gap-5 bg-[#0d0d1a] p-6 rounded-[14px] border border-white/5 focus-within:border-[#c9a84c]/40 transition-all group shadow-inner">

                        <MessageCircle size={22} className="text-[#c9a84c]/40 group-focus-within:text-[#c9a84c]" />

                        <input type="text" value={profileForm.telefone} onChange={(e) => setProfileForm({ ...profileForm, telefone: e.target.value })} className="bg-transparent flex-1 outline-none font-black text-xl text-white tracking-widest" />

                      </div>

                    </div>

                    <div className="space-y-3">

                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Terminal PIX</label>

                      <div className="flex items-center gap-5 bg-[#0d0d1a] p-6 rounded-[14px] border border-white/5 focus-within:border-[#c9a84c]/40 transition-all group shadow-inner">

                        <CreditCard size={22} className="text-[#c9a84c]/40 group-focus-within:text-[#c9a84c]" />

                        <input type="text" value={profileForm.pix_key} onChange={(e) => setProfileForm({ ...profileForm, pix_key: e.target.value })} className="bg-transparent flex-1 outline-none font-black text-xl text-[#22c55e] tracking-widest" />

                      </div>

                    </div>

                    <div className="space-y-3">

                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Instagram (Social)</label>

                      <div className="flex items-center gap-5 bg-[#0d0d1a] p-6 rounded-[14px] border border-white/5 focus-within:border-[#c9a84c]/40 transition-all group shadow-inner">

                        <Instagram size={22} className="text-[#c9a84c]/40 group-focus-within:text-[#c9a84c]" />

                        <input type="text" value={profileForm.instagram} onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })} className="bg-transparent flex-1 outline-none font-black text-xl text-white tracking-tighter" />

                      </div>

                    </div>

                    <div className="space-y-3 md:col-span-2">

                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Manifesto da Loja (Bio)</label>

                      <textarea rows={4} value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} className="w-full bg-[#0d0d1a] p-8 rounded-[14px] border border-white/5 outline-none focus:border-[#c9a84c]/40 transition-all font-bold text-slate-300 shadow-inner resize-none italic" placeholder="Defina o propósito da sua operação..." />

                    </div>

                  </div>



                  <button onClick={updateProfile} disabled={updating} className="group relative w-full bg-[#c9a84c] py-7 rounded-[14px] text-black font-black uppercase text-sm tracking-[0.3em] shadow-2xl shadow-[#c9a84c]/20 mt-16 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-5 overflow-hidden font-heading italic">

                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                    {updating ? <Loader2 className="animate-spin" size={28} /> : <><Save size={28} /> Autenticar Alterações</>}

                  </button>

                </div>

              </div>

            </div>

          </div>

        )}

        {activeTab === 'dashboard' && (

          <div className="space-y-10 animate-in fade-in duration-700">

            <div className="greeting flex justify-between items-end mb-12">

              <div className="space-y-4">

                <div className="flex items-center gap-3">

                  <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none font-heading">Meu Império</h1>

                  <span className="text-2xl animate-bounce">👑</span>

                </div>

                <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] opacity-80">Resumo da sua operação técnica " {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>

              </div>

              <div className="flex items-center gap-4">

                <div className="px-5 py-2.5 bg-[#c9a84c]/10 rounded-xl border border-[#c9a84c]/20 flex items-center gap-3 text-[10px] font-black text-[#c9a84c] uppercase tracking-widest shadow-lg shadow-[#c9a84c]/5">

                  <div className="w-2 h-2 bg-[#c9a84c] rounded-full animate-pulse" /> Nível Diamante

                </div>

              </div>

            </div>



            {/* Grid de 4 Cards (ThaiCamisas Style) */}

            {/* Grid de 4 Cards (ThaiCamisas Precision) */}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

              <div className="card">

                <div className="card-icon">📦</div>

                <div className="card-label">Pedidos Hoje</div>

                <div className="card-value">{dashboardData?.stats?.pedidos_hoje || 0}</div>

                <div className="card-sub up">+12% vs ontem</div>

              </div>

              <div className="card">

                <div className="card-icon">💰</div>

                <div className="card-label">Faturamento (Mês)</div>

                <div className="card-value">R$ {dashboardData?.stats?.faturamento_mes?.toFixed(2) || '0.00'}</div>

                <div className="card-sub up">Meta 85% atingida</div>

              </div>

              <div className="card">

                <div className="card-icon">📋</div>

                <div className="card-label">Protocolos Ativos</div>

                <div className="card-value">{dashboardData?.stats?.protocolos_ativos || 0}</div>

                <div className="card-sub neutral">Em trâmite global</div>

              </div>

              <div className="card">

                <div className="card-icon">👑</div>

                <div className="card-label">Base de Fãs</div>

                <div className="card-value">{dashboardData?.stats?.total_clientes || 0}</div>

                <div className="card-sub neutral text-[#c9a84c]">Capacidade Máxima</div>

              </div>

            </div>



            {/* Bottom Visual Grid */}

            <div className="bottom-grid mt-12">

              <div className="panel">

                <div className="panel-title">

                  <span>📊</span> Vendas — Últimos 7 dias

                </div>

                <div className="bar-chart">

                  {(dashboardData?.stats?.vendas_7_dias || [0, 0, 0, 0, 0, 0, 0]).map((val: number, i: number) => {

                    const max = Math.max(...(dashboardData?.stats?.vendas_7_dias || [1]));

                    const height = max > 0 ? (val / max) * 100 : 0;

                    return (

                      <div key={i} className="bar-wrap">

                        <div className="bar" style={{ height: `${Math.max(height, 5)}%` }} />

                        <div className="bar-label">{['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}</div>

                      </div>

                    );

                  })}

                </div>

              </div>



              <div className="panel">

                <div className="panel-title">

                  <span>🔥</span> Top Produtos (Semana)

                </div>

                <div className="space-y-4">

                  {catalog.slice(0, 4).map((p, i) => (

                    <div key={p.id} className="product-row">

                      <div className="product-thumb relative">

                        {p.foto_principal ? <Image src={p.foto_principal} alt="" fill className="object-cover" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center"><ImageIcon size={16} className="text-white/10" /></div>}

                      </div>

                      <div className="flex-1">

                        <div className="text-[12px] font-black uppercase text-white truncate">{p.nome}</div>

                        <div className="text-[10px] text-slate-500 font-bold uppercase">{p.time.nome}</div>

                      </div>

                      <div className="text-[#c9a84c] font-black italic">#{i + 1}</div>

                    </div>

                  ))}

                </div>

              </div>

            </div>



            {/* Pedidos Recentes Overview */}

            <div className="bg-[#111827]/30 p-10 rounded-[14px] border border-white/5 shadow-2xl">

              <div className="flex justify-between items-center mb-10">

                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">

                  <div className="w-1.5 h-4 bg-[#c9a84c] rounded-full" /> Meus Pedidos

                </h3>

                <button onClick={() => setActiveTab('pedidos')} className="text-[10px] font-black text-[#c9a84c] uppercase tracking-widest hover:underline">Gerenciar Tudo</button>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full text-left">

                  <thead>

                    <tr className="text-slate-600 border-b border-white/5">

                      <th className="pb-6 text-[10px] font-black uppercase tracking-widest">PEDIDO</th>

                      <th className="pb-6 text-[10px] font-black uppercase tracking-widest">Fã (Cliente)</th>

                      <th className="pb-6 text-[10px] font-black uppercase tracking-widest">Capítulo (Status)</th>

                      <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-right">Valor Final</th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-white/[0.02]">

                    {pedidos.slice(0, 5).map(ped => (

                      <tr key={ped.id} className="group hover:bg-white/[0.01] transition-colors">

                        <td className="py-6 text-sm font-black text-white uppercase italic tracking-tighter">#{ped.numero_pedido}</td>

                        <td className="py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">{ped.cliente?.nome}</td>

                        <td className="py-6">

                          <span className="px-3 py-1.5 bg-[#c9a84c]/10 text-[#c9a84c] rounded-lg text-[9px] font-black uppercase tracking-widest border border-[#c9a84c]/20">

                            {ped.status.replace('_', ' ')}

                          </span>

                        </td>

                        <td className="py-6 text-right font-black text-white italic tracking-tighter">R$ {parseFloat(ped.total).toFixed(2)}</td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>



            {/* Footer Premium ThaiCamisas */}

            <div className="flex flex-col md:flex-row justify-between items-center p-12 bg-white/[0.01] border border-white/5 rounded-[14px] gap-8">

              <div className="flex flex-col">

                <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.4em]">Portal de Revenda Profissional " v3.0 Elite Alpha</p>

                <p className="text-[10px] text-slate-800 font-bold uppercase tracking-widest mt-2 italic text-gray-400">Suporte Técnico: suporte@wzsport.com.br</p>

              </div>

              <div className="flex items-center gap-4">

                <div className="text-right">

                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Nível do Revendedor</p>

                  <p className="text-2xl font-black text-[#c9a84c] italic uppercase tracking-tighter">Nível Diamante 💎</p>

                </div>

              </div>

            </div>

          </div>

        )}



        {/* Tab: Produtos */}

        {activeTab === 'produtos' && (

          <div className="p-8 space-y-12 animate-in slide-in-from-bottom duration-500">

            <div className="flex flex-col lg:flex-row gap-8">

              <div className="bg-[#111827]/40 backdrop-blur-xl p-8 rounded-[14px] border border-[#c9a84c]/10 shadow-2xl flex-1 flex flex-col md:flex-row items-center gap-8 group hover:border-[#c9a84c]/30 transition-all">

                <div className="w-16 h-16 bg-[#c9a84c]/10 rounded-2xl flex items-center justify-center text-[#c9a84c] shrink-0 shadow-[0_0_20px_rgba(201,168,76,0.1)] border border-[#c9a84c]/20 group-hover:bg-[#c9a84c] group-hover:text-black transition-all"><TrendingUp size={30} /></div>

                <div className="flex-1">

                  <h4 className="text-xl font-black text-white italic tracking-tighter uppercase mb-1 font-heading">Margem Global Pro</h4>

                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-4">Atualize o lucro de todo o catálogo em tempo real</p>

                  <div className="flex items-center gap-4">

                    <div className="bg-[#0d0d1a] px-6 py-4 rounded-2xl border border-[#c9a84c]/20 font-black text-xl flex items-center gap-4 shadow-inner">

                      <span className="text-[#c9a84c] text-sm italic">R$</span>

                      <input type="number" value={globalMargin} onChange={(e) => setGlobalMargin(parseInt(e.target.value))} className="bg-transparent w-20 outline-none text-white tracking-widest" />

                    </div>

                    <button onClick={async () => {

                      if (!confirm("Atualizar TODO o catálogo com R$ " + globalMargin + " de lucro?")) return;

                      setUpdating(true);

                      const token = localStorage.getItem('crm_token');

                      await fetch(`${API_URL}/api/admin/catalogo/global-margin`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ margem: globalMargin })
                      });

                      await fetchData(); setUpdating(false);

                    }} disabled={updating} className="bg-gradient-to-tr from-[#c9a84c] to-[#e8c96d] px-10 py-5 rounded-2xl text-black font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#c9a84c]/20 transition-all hover:scale-105 disabled:opacity-50">

                      {updating ? 'Sincronizando...' : 'Publicar em Lote'}

                    </button>

                  </div>

                </div>

              </div>



              <div className="bg-[#1a1a2e] p-8 rounded-[14px] border-2 border-dashed border-[#c9a84c]/20 flex flex-col justify-center items-center text-center cursor-pointer hover:border-[#c9a84c] hover:bg-[#c9a84c]/5 transition-all group w-full lg:w-72" onClick={() => setIsAddingProduct(true)}>

                <div className="w-14 h-14 rounded-2xl bg-[#c9a84c]/10 flex items-center justify-center mb-4 group-hover:bg-[#c9a84c] group-hover:text-black transition-all text-[#c9a84c] border border-[#c9a84c]/20"><Plus size={28} /></div>

                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#c9a84c] group-hover:text-white transition-all">Adicionar Manto</span>

              </div>

            </div>



            <div className="bg-[#111827]/30 backdrop-blur-xl rounded-[14px] border border-[#c9a84c]/10 overflow-hidden shadow-2xl">

              <div className="p-12 border-b border-[#c9a84c]/10 flex flex-col md:flex-row justify-between items-center gap-8">

                <div className="flex items-center gap-4">

                  <div className="w-2 h-10 bg-[#c9a84c] rounded-full shadow-[0_0_15px_#c9a84c]" />

                  <div>

                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter font-heading">Vitrine <span className="text-[#c9a84c]">VIP</span></h3>

                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">{filteredCatalog.length} Modelos Gerenciáveis</p>

                  </div>

                </div>

                <div className="relative w-full md:w-[32rem]">

                  <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-600" size={20} />

                  <input

                    type="text"

                    placeholder="Pesquisar Seleção, Clube ou Camiseta..."

                    value={searchTerm}

                    onChange={(e) => setSearchTerm(e.target.value)}

                    className="w-full bg-[#0d0d1a] border border-[#c9a84c]/10 rounded-[14px] py-5 pl-16 pr-8 outline-none focus:border-[#c9a84c] transition-all text-sm font-black text-white placeholder-slate-700 tracking-wide"

                  />

                </div>

              </div>



              <div className="p-8 space-y-4 max-h-[1200px] overflow-y-auto custom-scrollbar">

                {(() => {

                  const groups: any = {};

                  filteredCatalog.forEach(p => {

                    const cat = p.time?.liga?.categoria?.nome || 'OUTROS';

                    const team = p.time?.nome || 'OUTROS';

                    const model = p.tipo ? `MODELO ${p.tipo.toUpperCase()}` : getModelLabel(p.nome);



                    if (!groups[cat]) groups[cat] = {};

                    if (!groups[cat][team]) groups[cat][team] = {};

                    if (!groups[cat][team][model]) groups[cat][team][model] = [];

                    groups[cat][team][model].push(p);

                  });



                  return Object.entries(groups).sort().map(([catName, teams]: [string, any]) => (

                    <div key={catName} className="panel p-0 overflow-hidden mb-6">

                      <button

                        onClick={() => toggleCat(catName)}

                        className="w-full flex items-center justify-between p-6 hover:bg-[#c9a84c]/5 transition-all group"

                      >

                        <div className="flex items-center gap-5">

                          <div className="w-12 h-12 bg-gradient-to-tr from-[#c9a84c] to-[#e8c96d] rounded-xl flex items-center justify-center text-black shadow-lg shadow-[#c9a84c]/20">

                            <Shield size={22} />

                          </div>

                          <h4 className="text-2xl font-black uppercase italic tracking-tighter text-white group-hover:text-[#c9a84c] transition-colors font-heading leading-none">{catName}</h4>

                        </div>

                        <div className={`transition-transform duration-500 ${expandedCats.includes(catName) ? 'rotate-180' : ''} text-[#c9a84c]`}>

                          <ChevronDown size={24} />

                        </div>

                      </button>



                      {expandedCats.includes(catName) && (

                        <div className="p-4 space-y-3 bg-black/20">

                          {Object.entries(teams).sort().map(([teamName, models]: [string, any]) => (

                            <div key={teamName} className="border border-white/[0.05] rounded-xl overflow-hidden bg-white/[0.01] mb-2">

                              <div className="w-full flex items-center justify-between p-5 hover:bg-[#c9a84c]/5 transition-all group">

                                <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleTeam(`${catName}-${teamName}`)}>

                                  <div className="w-2 h-2 rounded-full bg-[#c9a84c] shadow-[0_0_10px_#c9a84c]" />

                                  <span className="font-black text-white uppercase tracking-tighter italic text-lg group-hover:text-[#c9a84c] transition-colors">{teamName}</span>

                                </div>

                                <div className="flex items-center gap-4">

                                  <button 

                                    onClick={(e) => {

                                      e.stopPropagation();

                                      const firstModel = Object.values(models)[0] as any[];

                                      const timeId = firstModel?.[0]?.time_id;

                                      if (timeId) deleteTeam(timeId);

                                    }} 

                                    className="p-2 text-red-500/20 hover:text-red-500 transition-colors"

                                    title="Excluir Time Globalmente"

                                  >

                                    <Trash2 size={16} />

                                  </button>

                                  <button onClick={() => toggleTeam(`${catName}-${teamName}`)} className="p-2 text-slate-600">

                                    <ChevronDown size={18} className={`transition-transform ${expandedTeams.includes(`${catName}-${teamName}`) ? 'rotate-180' : ''}`} />

                                  </button>

                                </div>

                              </div>



                              {expandedTeams.includes(`${catName}-${teamName}`) && (

                                <div className="p-3 pl-10 space-y-2 border-l-2 border-[#c9a84c]/20 ml-6">

                                  {Object.entries(models).sort().map(([modelName, products]: [string, any]) => (

                                    <div key={modelName} className="rounded-2xl overflow-hidden">

                                      <button

                                        onClick={() => toggleModel(`${catName}-${teamName}-${modelName}`)}

                                        className="w-full flex items-center justify-between p-3 hover:bg-white/[0.03] transition-all"

                                      >

                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{modelName}</span>

                                        <ChevronDown size={14} className={`text-slate-600 transition-transform ${expandedModels.includes(`${catName}-${teamName}-${modelName}`) ? 'rotate-180' : ''}`} />

                                      </button>



                                      {expandedModels.includes(`${catName}-${teamName}-${modelName}`) && (

                                        <div className="p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-in fade-in duration-300">

                                          {products.map((prod: any) => {

                                            const config = prod.precos_empresas[0];

                                            const ativo = config?.ativo || false;

                                            const cost = parseFloat(config?.preco_custo_personalizado || prod.preco_custo || 50);

                                            const margin = parseFloat(config?.margem || 100);

                                            const finalPrice = config?.preco_venda || (cost + margin);



                                            return (

                                              <div key={prod.id} className={`flex items-center gap-4 p-4 rounded-2xl border border-white/[0.05] hover:border-[#c9a84c]/30 transition-all ${!ativo ? 'bg-black/40 opacity-40 grayscale' : 'bg-white/[0.03] shadow-lg shadow-black/20'} group/card`}>

                                                <div

                                                  onClick={() => setSelectedProductPhotos({ id: prod.id, nome: prod.nome, fotos: config?.fotos_customizadas?.length > 0 ? config.fotos_customizadas : prod.fotos })}

                                                  className="w-16 h-20 bg-[#0d0d1a] rounded-2xl overflow-hidden relative border border-white/[0.05] cursor-pointer shrink-0"

                                                >

                                                  {(config?.foto_principal_customizada || prod.foto_principal) ? <Image src={config?.foto_principal_customizada || prod.foto_principal} alt="" fill className="object-cover group-hover/card:scale-110 transition-transform duration-500" /> : <div className="w-full h-full bg-white/5" />}

                                                </div>



                                                <div className="flex-1 min-w-0">

                                                  <h5 className="font-black text-white text-md uppercase tracking-tighter italic truncate leading-tight group-hover/card:text-[#c9a84c] transition-colors">{config?.nome_customizado || prod.nome}</h5>

                                                  <div className="flex items-center gap-2 mt-2">

                                                    <span className="text-lg font-black text-[#c9a84c] tracking-tighter italic">R$ {parseFloat(finalPrice).toFixed(2)}</span>

                                                    <span className="text-[9px] font-bold text-slate-500 uppercase">LP: R$ {margin.toFixed(0)}</span>

                                                  </div>

                                                </div>



                                                <div className="flex flex-col gap-2">

                                                  <button onClick={() => setEditingProduct({ ...prod, ...config, id: prod.id, cost, margin, finalPrice, time_nome_customizado: prod.time?.nome })} className="p-3 bg-white/5 text-slate-400 rounded-xl hover:bg-[#c9a84c] hover:text-black transition-all"><Edit3 size={16} /></button>

                                                  <button onClick={() => updateProduct({ produtoId: prod.id, precoVenda: finalPrice, margem: margin, ativo: !ativo })} className={`p-3 rounded-xl transition-all ${ativo ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20' : 'bg-slate-800 text-slate-600'}`}>

                                                    {ativo ? <Eye size={16} /> : <EyeOff size={16} />}

                                                  </button>

                                                  <button onClick={() => deleteProduct(prod.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"><Trash2 size={16} /></button>

                                                </div>

                                              </div>

                                            );

                                          })}

                                        </div>

                                      )}

                                    </div>

                                  ))}

                                </div>

                              )}

                            </div>

                          ))}

                        </div>

                      )}

                    </div>

                  ));

                })()}

              </div>

            </div>

          </div>

        )}



        {/* Tab: WhatsApp */}

        {activeTab === 'whatsapp' && (

          <div className="p-8 space-y-12 animate-in fade-in duration-500 text-center py-20 bg-[#0d0d1a]">

            <div className="max-w-2xl mx-auto bg-[#111827]/40 backdrop-blur-3xl p-16 rounded-[14px] border border-[#c9a84c]/20 shadow-3xl relative overflow-hidden group">

              <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#c9a84c]/5 rounded-full group-hover:scale-150 transition-all duration-1000" />



              <div className="w-24 h-24 bg-gradient-to-tr from-[#25D366] to-[#059669] text-white rounded-[14px] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-green-500/20 rotate-6 group-hover:rotate-0 transition-transform">

                <MessageCircle size={48} />

              </div>

              <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4 font-heading">Protocolo <span className="text-[#25D366]">WhatsApp</span></h2>

              <p className="text-slate-400 font-bold text-sm mb-12 uppercase tracking-widest leading-relaxed">

                Sincronize sua API Evolution para automatizar notificações de envio,<br />rastreio e suporte premium em tempo real.

              </p>



              {waStatus?.instance?.state === 'open' ? (

                <div className="p-8 bg-[#22c55e]/10 rounded-[14px] border border-[#22c55e]/20 shadow-xl">

                  <div className="flex items-center justify-center gap-4 text-[#22c55e] font-black uppercase tracking-[0.3em] text-sm">

                    <CheckCircle2 size={24} className="animate-pulse" /> Conectado & Sincronizado

                  </div>

                </div>

              ) : (

                <div className="space-y-10">

                  {qrCode ? (

                    <div className="flex flex-col items-center gap-8 animate-in zoom-in duration-500">

                      <div className="p-8 bg-white rounded-[14px] shadow-3xl relative overflow-hidden border-8 border-white">

                        <Image src={qrCode} alt="WhatsApp QR" width={280} height={280} />

                      </div>

                      <div className="flex items-center gap-3 px-8 py-3 bg-[#c9a84c]/10 text-[#c9a84c] rounded-full border border-[#c9a84c]/20 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">

                        <Activity size={12} /> Escaneie o código para liberar a API

                      </div>

                    </div>

                  ) : (

                    <button onClick={connectWhatsApp} className="group relative w-full bg-[#25D366] text-black py-7 rounded-[14px] font-black uppercase text-sm tracking-[0.3em] shadow-2xl shadow-green-500/30 hover:scale-[1.03] active:scale-95 transition-all overflow-hidden">

                      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                      Criar Nova Instância de Envio

                    </button>

                  )}

                </div>

              )}

            </div>

          </div>

        )}



        {/* Tab: Pedidos - Gestão de Elite */}

        {activeTab === 'pedidos' && (

          <div className="space-y-12 animate-in fade-in duration-700">

            {/* Filtros de Status Premium */}

            <div className="flex flex-wrap gap-4">

              {[{ key: 'todos', label: 'Operação Global' }, ...Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({ key, label: cfg.label }))].map(f => (

                <button key={f.key} onClick={() => setPedidoFilter(f.key)} className={`px-8 py-4 rounded-[14px] text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${pedidoFilter === f.key ? 'bg-[#c9a84c] text-black border-[#c9a84c] shadow-2xl shadow-[#c9a84c]/20' : 'bg-[#111827]/40 text-slate-500 border-white/5 hover:border-[#c9a84c]/40'

                  }`}>

                  {f.label} {f.key !== 'todos' && <span className="ml-2 px-2 py-0.5 bg-black/20 rounded-lg opacity-70">{pedidos.filter(p => p.status === f.key).length}</span>}

                </button>

              ))}

            </div>



            <div className="flex flex-col xl:flex-row gap-10">

              {/* Lista de Pedidos Premium */}

              <div className="flex-1 bg-[#111827]/30 backdrop-blur-xl rounded-[14px] border border-[#c9a84c]/10 shadow-3xl overflow-hidden">

                <div className="p-10 border-b border-[#c9a84c]/10 flex justify-between items-center bg-[#1a1a2e]/40">

                  <div>

                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter font-heading leading-none mb-2">Meus Pedidos</h3>

                    <p className="text-[10px] font-bold text-[#c9a84c] uppercase tracking-[0.3em] italic">{filteredPedidos.length} Pedidos Filtrados</p>

                  </div>

                  <button onClick={fetchData} className="p-4 bg-[#0d0d1a] rounded-2xl text-[#c9a84c] hover:bg-[#c9a84c] hover:text-black transition-all border border-[#c9a84c]/20"><RefreshCcw size={20} /></button>

                </div>

                <div className="max-h-[700px] overflow-y-auto custom-scrollbar divide-y divide-white/[0.03]">

                  {filteredPedidos.map((ped: any) => {

                    const sc = STATUS_CONFIG[ped.status] || STATUS_CONFIG.pendente;

                    const StatusIcon = sc.icon;

                    return (

                      <div key={ped.id} onClick={() => { setSelectedPedido(ped); setRastreioInput(ped.rastreio_codigo || ''); }} className={`p-8 cursor-pointer transition-all flex items-center gap-6 group ${selectedPedido?.id === ped.id ? 'bg-[#c9a84c]/10 border-l-[6px] border-[#c9a84c]' : 'hover:bg-[#c9a84c]/5'}`}>

                        <div className={`w-14 h-14 rounded-2xl ${sc.bg} border border-[#c9a84c]/20 flex items-center justify-center ${sc.color} shadow-lg group-hover:scale-110 transition-transform`}><StatusIcon size={24} /></div>

                        <div className="flex-1 min-w-0">

                          <div className="flex items-center justify-between mb-2">

                            <span className="text-xl font-black text-white uppercase italic tracking-tighter group-hover:text-[#c9a84c] transition-colors leading-none">#{ped.numero_pedido}</span>

                            <span className="text-2xl font-black text-white italic tracking-tighter">R$ {parseFloat(ped.total).toFixed(2)}</span>

                          </div>

                          <div className="flex items-center justify-between">

                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest truncate">{ped.cliente?.nome}</span>

                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">{new Date(ped.criado_em).toLocaleDateString('pt-BR')}</span>

                          </div>

                        </div>

                      </div>

                    );

                  })}

                </div>

              </div>



              {/* Detalhe do Pedido Selecionado Premium */}

              <div className="w-full xl:w-[500px] shrink-0">

                {selectedPedido ? (() => {

                  const sc = STATUS_CONFIG[selectedPedido.status] || STATUS_CONFIG.pendente;

                  const StatusIcon = sc.icon;

                  const nextStatus = getNextStatus(selectedPedido.status);

                  const nextConfig = nextStatus ? STATUS_CONFIG[nextStatus] : null;

                  const cli = selectedPedido.cliente;

                  return (

                    <div className="bg-[#111827]/40 backdrop-blur-3xl rounded-[14px] border border-[#c9a84c]/20 shadow-3xl overflow-hidden sticky top-8 animate-in slide-in-from-right duration-500">

                      <div className={`p-12 ${sc.bg} bg-opacity-10 border-b border-[#c9a84c]/10 relative overflow-hidden text-center`}>

                        <div className="absolute top-0 right-0 p-10 opacity-5"><StatusIcon size={120} /></div>

                        <div className="relative z-10 flex flex-col items-center">

                          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl ${sc.bg} border ${sc.color} text-[10px] font-black uppercase tracking-[0.2em] shadow-lg mb-8`}>

                            <StatusIcon size={16} /> {sc.label}

                          </div>

                          <span className="text-5xl font-black italic tracking-tighter text-white uppercase font-heading mb-4 leading-none">#{selectedPedido.numero_pedido}</span>

                          <div className="text-4xl font-black text-[#c9a84c] tracking-tighter italic leading-none mb-3 font-heading">R$ {parseFloat(selectedPedido.total).toFixed(2)}</div>

                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(selectedPedido.criado_em).toLocaleString('pt-BR')}</div>

                        </div>

                      </div>



                      <div className="p-10 space-y-10">

                        {/* Cliente e Chat */}

                        <div className="space-y-6">

                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">

                            <div className="w-1.5 h-4 bg-[#25D366] rounded-full shadow-[0_0_10px_rgba(37,211,102,0.4)]" /> Messenger de Operação

                          </h4>

                          <div className="bg-[#0d0d1a] p-8 rounded-[14px] border border-white/5 space-y-6">

                            <div className="flex items-center gap-4 border-b border-white/5 pb-6">

                              <div className="w-12 h-12 bg-[#c9a84c] text-black rounded-xl flex items-center justify-center font-black italic text-xl">{cli?.nome?.charAt(0)}</div>

                              <div className="flex flex-col">

                                <span className="font-black text-white uppercase italic tracking-tighter leading-none">{cli?.nome}</span>

                                <span className="text-[10px] font-bold text-slate-500 tracking-widest mt-2">{cli?.telefone}</span>

                              </div>

                            </div>

                            <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)} placeholder="Mensagem de protocolo..." rows={2} className="w-full bg-black/20 p-5 rounded-2xl border border-white/5 outline-none focus:border-[#25D366]/40 text-slate-300 font-bold italic text-xs resize-none" />

                            <button onClick={() => sendDirectMessage(cli?.telefone, customMessage)} disabled={sendingMessage || !customMessage.trim()} className="w-full flex items-center justify-center gap-4 py-6 bg-[#25D366] text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[#1da851] transition-all disabled:opacity-30">

                              {sendingMessage ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Transmitir via WhatsApp

                            </button>

                          </div>

                        </div>



                        {/* Ações Avanço */}

                        <div className="pt-8 border-t border-white/5 space-y-6">

                          {(selectedPedido.status === 'etiqueta_gerada' || selectedPedido.status === 'enviado') && (

                            <div className="space-y-4">

                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Código de Rastreio</label>

                              <input type="text" value={rastreioInput} onChange={e => setRastreioInput(e.target.value)} placeholder="INSIRA O CÓDIGO" className="w-full bg-[#0d0d1a] px-8 py-5 rounded-2xl border border-white/5 text-white font-black tracking-widest uppercase italic outline-none focus:border-[#c9a84c]/60 shadow-inner" />

                            </div>

                          )}

                          {nextStatus && nextConfig && (

                            <button onClick={() => updatePedidoStatus(selectedPedido.id, nextStatus, nextStatus === 'enviado' ? rastreioInput : undefined)} className="group relative w-full flex items-center justify-center gap-4 py-7 bg-white text-black rounded-[14px] font-black text-xs uppercase tracking-[0.3em] hover:scale-[1.03] active:scale-95 transition-all shadow-2xl font-heading italic">

                              <ArrowRight size={20} /> Promover: {nextConfig.label}

                            </button>

                          )}

                        </div>

                      </div>

                    </div>

                  );

                })() : (

                  <div className="bg-[#111827]/30 backdrop-blur-xl rounded-[14px] border border-[#c9a84c]/10 shadow-3xl p-20 text-center flex flex-col items-center sticky top-8 animate-in zoom-in duration-500">

                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-slate-800 mb-8 border border-white/5 shadow-2xl"><Package size={48} /></div>

                    <h3 className="text-2xl font-black text-slate-700 uppercase italic tracking-tighter font-heading mb-2">Protocolo Vazio</h3>

                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.4em] italic leading-relaxed">Selecione para processar</p>

                  </div>

                )}

              </div>

            </div>

          </div>

        )}



        {/* Tab: Clientes */}
        {activeTab === 'clientes' && (
          <div className="space-y-6 animate-in fade-in duration-700">

            {/* Header */}
            <div className="bg-[#111827]/30 backdrop-blur-xl rounded-[14px] border border-[#c9a84c]/10 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter font-heading leading-none mb-2">
                  Minha <span className="text-[#c9a84c]">Comunidade</span>
                </h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                  {clientes.length} fãs cadastrados
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text" value={clienteSearch} onChange={(e) => setClienteSearch(e.target.value)}
                    placeholder="Buscar cliente..." className="bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-6 text-sm outline-none focus:border-[#c9a84c]/40 w-56 transition-all"
                  />
                </div>
                <button onClick={() => { setEditingCliente({}); setClienteForm({ nome: '', telefone: '', email: '', cpf: '', cidade: '', estado: '', cep: '' }); }}
                  className="bg-gradient-to-tr from-[#c9a84c] to-[#e8c96d] px-6 py-3 rounded-xl text-black font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                  <Plus size={16} /> Novo Cliente
                </button>
              </div>
            </div>

            {/* Feedback */}
            {clienteSuccess && <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-6 py-4 rounded-xl text-sm font-bold flex items-center gap-3"><CheckCircle2 size={16} />{clienteSuccess}</div>}
            {clienteError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-xl text-sm font-bold flex items-center gap-3"><AlertCircle size={16} />{clienteError}</div>}

            {/* Table */}
            <div className="bg-[#111827]/30 backdrop-blur-xl rounded-[14px] border border-[#c9a84c]/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#0d0d1a]/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
                      <th className="px-8 py-5">Cliente</th>
                      <th className="px-8 py-5">Contato</th>
                      <th className="px-8 py-5">CPF</th>
                      <th className="px-8 py-5">Cidade/UF</th>
                      <th className="px-8 py-5">Pedidos</th>
                      <th className="px-8 py-5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {clientes
                      .filter(c => !clienteSearch || c.nome?.toLowerCase().includes(clienteSearch.toLowerCase()) || c.telefone?.includes(clienteSearch))
                      .map((cli: any) => (
                        <tr key={cli.id} className="hover:bg-[#c9a84c]/5 transition-all group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-[#1a1a2e] rounded-xl flex items-center justify-center font-black text-[#c9a84c] uppercase italic border border-[#c9a84c]/20 group-hover:bg-[#c9a84c] group-hover:text-black transition-all flex-shrink-0">
                                {cli.nome?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-black text-white uppercase italic text-sm">{cli.nome}</p>
                                <p className="text-[10px] text-slate-600 mt-0.5">Desde {new Date(cli.criado_em).toLocaleDateString('pt-BR')}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-bold text-white">{cli.telefone}</span>
                              {cli.email && <span className="text-[10px] text-slate-500">{cli.email}</span>}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-xs font-bold text-slate-400">{cli.cpf || '—'}</td>
                          <td className="px-8 py-5 text-xs font-bold text-slate-400">
                            {cli.cidade ? `${cli.cidade}/${cli.estado || ''}` : '—'}
                          </td>
                          <td className="px-8 py-5">
                            <span className="px-3 py-1 bg-[#c9a84c]/10 text-[#c9a84c] rounded-lg text-[10px] font-black border border-[#c9a84c]/20">
                              {cli._count?.pedidos || 0} pedidos
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center justify-center gap-2">
                              <a href={`https://wa.me/55${cli.telefone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                                className="p-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500 hover:text-white transition-all border border-green-500/20" title="WhatsApp">
                                <MessageCircle size={14} />
                              </a>
                              <button onClick={() => { setEditingCliente(cli); setClienteForm({ nome: cli.nome, telefone: cli.telefone, email: cli.email || '', cpf: cli.cpf || '', cidade: cli.cidade || '', estado: cli.estado || '', cep: cli.cep || '', logradouro: cli.logradouro || '', numero: cli.numero || '', bairro: cli.bairro || '', complemento: cli.complemento || '', observacoes: cli.observacoes || '' }); }}
                                className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all border border-blue-500/20" title="Editar">
                                <Edit3 size={14} />
                              </button>
                              <button onClick={() => deleteCliente(cli.id)}
                                className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all border border-red-500/20" title="Excluir">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {clientes.length === 0 && (
                      <tr><td colSpan={6} className="px-8 py-16 text-center text-slate-600 text-sm font-bold">Nenhum cliente cadastrado ainda.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal: Criar/Editar Cliente */}
            {editingCliente !== null && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-[#0d0d1a]/80 backdrop-blur-xl" onClick={() => setEditingCliente(null)} />
                <div className="bg-[#111827] w-full max-w-2xl rounded-[14px] shadow-3xl relative border border-[#c9a84c]/20 p-10 animate-in zoom-in">
                  <button onClick={() => setEditingCliente(null)} className="absolute top-6 right-6 p-3 bg-[#0d0d1a] rounded-xl border border-white/5 text-slate-500 hover:text-white transition-all">
                    <X size={18} />
                  </button>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-8">
                    {editingCliente.id ? 'Editar' : 'Novo'} <span className="text-[#c9a84c]">Cliente</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Nome *', key: 'nome', type: 'text' },
                      { label: 'Telefone/WhatsApp *', key: 'telefone', type: 'tel' },
                      { label: 'E-mail', key: 'email', type: 'email' },
                      { label: 'CPF', key: 'cpf', type: 'text' },
                      { label: 'CEP', key: 'cep', type: 'text' },
                      { label: 'Cidade', key: 'cidade', type: 'text' },
                      { label: 'Estado (UF)', key: 'estado', type: 'text' },
                      { label: 'Logradouro', key: 'logradouro', type: 'text' },
                      { label: 'Número', key: 'numero', type: 'text' },
                      { label: 'Bairro', key: 'bairro', type: 'text' },
                    ].map(field => (
                      <div key={field.key} className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{field.label}</label>
                        <input type={field.type} value={(clienteForm as any)[field.key] || ''}
                          onChange={e => setClienteForm((p: any) => ({ ...p, [field.key]: e.target.value }))}
                          className="bg-[#0d0d1a] border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#c9a84c]/40 transition-all" />
                      </div>
                    ))}
                    <div className="md:col-span-2 flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Observações</label>
                      <textarea rows={3} value={clienteForm.observacoes || ''}
                        onChange={e => setClienteForm((p: any) => ({ ...p, observacoes: e.target.value }))}
                        className="bg-[#0d0d1a] border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#c9a84c]/40 transition-all resize-none" />
                    </div>
                  </div>
                  {clienteError && <p className="text-red-400 text-xs font-bold mt-4">{clienteError}</p>}
                  <button onClick={saveCliente} disabled={savingCliente}
                    className="mt-8 w-full bg-gradient-to-tr from-[#c9a84c] to-[#e8c96d] py-4 rounded-xl text-black font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                    {savingCliente ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {savingCliente ? 'Salvando...' : (editingCliente.id ? 'Atualizar Cliente' : 'Criar Cliente')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL: Edit Product Premium */}

        {editingProduct && (

          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

            <div className="absolute inset-0 bg-[#0d0d1a]/80 backdrop-blur-xl animate-in fade-in" onClick={() => setEditingProduct(null)} />

            <div className="bg-[#111827] w-full max-w-5xl rounded-[14px] shadow-3xl relative overflow-hidden flex flex-col md:flex-row animate-in zoom-in border border-[#c9a84c]/20">

              <button onClick={() => setEditingProduct(null)} className="absolute top-8 right-8 z-10 p-4 bg-[#0d0d1a] rounded-2xl border border-[#c9a84c]/20 text-slate-500 hover:text-[#c9a84c] transition-all shadow-2xl"><X size={24} /></button>



              <div className="w-full md:w-[45%] bg-[#0d0d1a] relative aspect-square md:aspect-auto group border-r border-[#c9a84c]/10 p-12">

                {(editingProduct.foto_principal_customizada || editingProduct.foto_principal) ? <Image src={editingProduct.foto_principal_customizada || editingProduct.foto_principal} alt="" fill className="object-contain p-10" /> : <div className="w-full h-full flex items-center justify-center"><Camera size={48} className="text-white/10" /></div>}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-6">

                  <label className="cursor-pointer bg-[#c9a84c] p-6 rounded-2xl flex items-center gap-4 font-black text-[10px] uppercase tracking-[0.2em] text-black shadow-2xl hover:scale-105 transition-all">

                    <Camera size={18} /> Substituir Assets

                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, false)} />

                  </label>

                </div>

              </div>



              <div className="flex-1 p-16 flex flex-col justify-center bg-[#111827]/30 backdrop-blur-3xl overflow-y-auto max-h-[90vh]">

                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none font-heading mb-12">Protocolo <span className="text-[#c9a84c]">Personalize</span></h3>

                <div className="space-y-8">


                  <div className="grid grid-cols-2 gap-8">

                    <div className="space-y-3">

                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Nome da Peça</label>

                      <input type="text" value={editingProduct.nome_customizado ?? editingProduct.nome} onChange={(e) => setEditingProduct({ ...editingProduct, nome_customizado: e.target.value })} className="w-full bg-[#0d0d1a] p-6 rounded-[14px] border border-white/5 outline-none focus:border-[#c9a84c]/40 transition-all font-black text-xl text-white italic uppercase tracking-tighter" />

                    </div>

                    <div className="space-y-3">

                      <label className="text-[10px] font-black text-[#c9a84c] uppercase tracking-[0.3em] ml-4">Nome do Time (Global)</label>

                      <input type="text" value={editingProduct.time_nome_customizado ?? editingProduct.time?.nome} onChange={(e) => setEditingProduct({ ...editingProduct, time_nome_customizado: e.target.value })} className="w-full bg-[#0d0d1a] p-6 rounded-[14px] border border-[#c9a84c]/20 outline-none focus:border-[#c9a84c] transition-all font-black text-xl text-[#c9a84c] italic uppercase tracking-tighter" />

                    </div>

                  </div>

                  <div className="grid grid-cols-2 gap-8">

                    <div className="space-y-3">

                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Tipo/Versão</label>

                      <select value={editingProduct.tipo || 'torcedor'} onChange={(e) => setEditingProduct({ ...editingProduct, tipo: e.target.value })} className="w-full bg-[#0d0d1a] p-6 rounded-[14px] border border-white/5 outline-none focus:border-[#c9a84c]/40 text-sm font-black text-white uppercase italic appearance-none cursor-pointer">

                        <option value="torcedor">Torcedor</option>

                        <option value="jogador">Jogador</option>

                        <option value="feminina">Feminina</option>

                        <option value="infantil">Infantil</option>

                      </select>

                    </div>

                    <div className="space-y-3">

                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Minha Margem (R$)</label>

                      <input type="text" value={editingProduct.margin} onChange={(e) => setEditingProduct({ ...editingProduct, margin: e.target.value.replace(',', '.') })} className="w-full bg-[#0d0d1a] p-6 rounded-[14px] border border-white/5 outline-none focus:border-[#c9a84c]/40 transition-all font-black text-2xl text-[#c9a84c]" />

                    </div>

                  </div>

                  <div className="space-y-3">

                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Valor Final Vitrine</label>

                    <div className="w-full bg-[#c9a84c]/10 p-6 rounded-[14px] border border-[#c9a84c]/20 text-[#c9a84c] font-black text-2xl italic tracking-tighter flex items-center justify-center">

                      R$ {( (parseFloat(editingProduct.cost?.toString().replace(',', '.')) || 0) + (parseFloat(editingProduct.margin?.toString().replace(',', '.')) || 0) ).toFixed(2)}

                    </div>

                  </div>

                  <button onClick={() => updateProduct({ 
                    produtoId: editingProduct.id, 
                    precoVenda: (parseFloat(editingProduct.cost.toString().replace(',', '.')) || 0) + (parseFloat(editingProduct.margin.toString().replace(',', '.')) || 0), 
                    margem: parseFloat(editingProduct.margin.toString().replace(',', '.')) || 0, 
                    ativo: editingProduct.ativo, 
                    nomeCustomizado: editingProduct.nome_customizado, 
                    timeNomeCustomizado: editingProduct.time_nome_customizado,
                    tipo: editingProduct.tipo, 
                    descricaoCustomizada: editingProduct.descricao_customizada, 
                    fotoPrincipal: editingProduct.foto_principal_customizada === null ? 'REMOVED' : editingProduct.foto_principal_customizada?.startsWith('data:') ? editingProduct.foto_principal_customizada : null 
                  })} className="w-full bg-[#c9a84c] py-7 rounded-[14px] text-black font-black uppercase text-xs tracking-[0.4em] shadow-3xl shadow-[#c9a84c]/20 mt-10 hover:scale-[1.02] transition-all font-heading italic">

                    Efetivar Nova Versão

                  </button>

                </div>

              </div>

            </div>

          </div>

        )}



        {/* MODAL: Add Customer Premium */}

        {isAddingCustomer && (

          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

            <div className="absolute inset-0 bg-[#0d0d1a]/80 backdrop-blur-xl animate-in fade-in" onClick={() => setIsAddingCustomer(false)} />

            <div className="bg-[#111827] w-full max-w-2xl rounded-[14px] shadow-3xl relative overflow-hidden border border-[#c9a84c]/20 animate-in zoom-in">

              <div className="p-14 border-b border-[#c9a84c]/10 flex items-center justify-between bg-[#1a1a2e]/40">

                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter font-heading">Protocolo <span className="text-[#c9a84c]">Novo Fã</span></h3>

                <button onClick={() => setIsAddingCustomer(false)} className="p-4 text-slate-400 hover:text-[#c9a84c] rounded-2xl transition-all border border-white/5"><X size={24} /></button>

              </div>

              <div className="p-14 space-y-8">

                <div className="space-y-4">

                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Nome Completo</label>

                  <input type="text" onChange={(e) => setNewCustomer({ ...newCustomer, nome: e.target.value })} className="w-full bg-[#0d0d1a] p-6 rounded-[14px] border border-white/5 outline-none focus:border-[#c9a84c]/40 transition-all font-black text-white uppercase italic" />

                </div>

                <div className="grid grid-cols-2 gap-8">

                  <div className="space-y-4">

                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">WhatsApp Operacional</label>

                    <input type="text" placeholder="55..." onChange={(e) => setNewCustomer({ ...newCustomer, telefone: e.target.value })} className="w-full bg-[#0d0d1a] p-6 rounded-[14px] border border-white/5 outline-none focus:border-[#25D366]/40 text-white font-black tracking-widest" />

                  </div>

                  <div className="space-y-4">

                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Estado (UF)</label>

                    <input type="text" maxLength={2} onChange={(e) => setNewCustomer({ ...newCustomer, estado: e.target.value })} className="w-full bg-[#0d0d1a] p-6 rounded-[14px] border border-white/5 outline-none focus:border-[#c9a84c]/40 text-white font-black uppercase text-center" />

                    <button onClick={createCustomer} className="w-full bg-[#c9a84c] py-7 rounded-[14px] text-black font-black uppercase text-xs tracking-[0.3em] shadow-3xl shadow-[#c9a84c]/20 mt-10 hover:scale-[1.02] transition-all font-heading italic">

                      Efetivar Registro

                    </button>

                  </div>

                </div>

              </div>

            </div>

          </div>

        )}



        {/* MODAL: Add Product Premium */}

        {isAddingProduct && (

          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

            <div className="absolute inset-0 bg-[#0d0d1a]/80 backdrop-blur-xl animate-in fade-in" onClick={() => setIsAddingProduct(false)} />

            <div className="bg-[#111827] w-full max-w-4xl rounded-[14px] shadow-3xl relative overflow-hidden border border-[#c9a84c]/20 animate-in zoom-in">

              <div className="p-14 border-b border-[#c9a84c]/10 flex items-center justify-between bg-[#1a1a2e]/40">

                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter font-heading">Expansão <span className="text-[#c9a84c]">Vitrine</span></h3>

                <button onClick={() => setIsAddingProduct(false)} className="p-4 text-slate-400 hover:text-[#c9a84c] rounded-2xl transition-all border border-white/5"><X size={24} /></button>

              </div>

              <div className="p-14 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">

                <div className="space-y-4">

                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Nome da Peça</label>

                  <input type="text" onChange={(e) => setNewProduct({ ...newProduct, nome: e.target.value })} className="w-full bg-[#0d0d1a] p-6 rounded-[14px] border border-white/5 outline-none focus:border-[#c9a84c]/40 transition-all font-black text-white uppercase italic" />

                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">

                  <div className="space-y-4">

                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Tipo/Versao</label>

                    <select value={newProduct.tipo} onChange={(e) => setNewProduct({ ...newProduct, tipo: e.target.value })} className="w-full bg-[#0d0d1a] p-6 rounded-[14px] border border-white/5 outline-none focus:border-[#c9a84c]/40 text-white font-black uppercase italic appearance-none cursor-pointer">

                      <option value="torcedor">Torcedor</option>

                      <option value="jogador">Jogador</option>

                      <option value="feminina">Feminina</option>

                      <option value="infantil">Infantil</option>

                    </select>

                  </div>

                  <div className="space-y-4">

                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Liga Elite</label>

                    <select onChange={(e) => setNewProduct({ ...newProduct, ligaId: e.target.value })} className="w-full bg-[#0d0d1a] p-6 rounded-[14px] border border-white/5 outline-none focus:border-[#c9a84c]/40 text-white font-black uppercase italic appearance-none cursor-pointer">

                      <option value="">Selecione...</option>

                      {ligas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}

                    </select>

                  </div>

                  <div className="space-y-4">

                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Nome do Time</label>

                    <input type="text" placeholder="Ex: Flamengo..." onChange={(e) => setNewProduct({ ...newProduct, timeNome: e.target.value })} className="w-full bg-[#0d0d1a] p-6 rounded-[14px] border border-white/5 outline-none focus:border-[#c9a84c]/40 transition-all font-black text-white uppercase italic" />

                  </div>

                  <div className="space-y-4">

                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Asset URL</label>

                    <div className="flex gap-4">

                      <input type="text" value={newProduct.fotoPrincipal} onChange={(e) => setNewProduct({ ...newProduct, fotoPrincipal: e.target.value })} className="flex-1 bg-[#0d0d1a] p-6 rounded-[14px] border border-white/5 outline-none text-[10px] font-bold" />

                      <label className="cursor-pointer bg-[#c9a84c] p-6 rounded-2xl flex items-center justify-center text-black hover:scale-105 transition-all"><Camera size={20} /><input type="file" className="hidden" onChange={(e) => handleFileUpload(e, true)} /></label>

                    </div>

                  </div>

                </div>

                <button onClick={createCustomProduct} className="w-full bg-[#c9a84c] py-7 rounded-[14px] text-black font-black uppercase text-xs tracking-[0.3em] shadow-3xl shadow-[#c9a84c]/20 mt-10 hover:scale-[1.02] transition-all font-heading italic">

                  Publicar em Minha Loja

                </button>

              </div>

            </div>

          </div>

        )}



        <style jsx global>{`

                body { background-color: #0d0d1a !important; color: #e2e8f0; }

                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }

                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }

                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(201, 168, 76, 0.4); border-radius: 10px; }

                @font-face { font-family: 'Heading'; src: url('https://fonts.googleapis.com/css2?family=Outfit:wght@900&display=swap'); }

                .font-heading { font-family: 'Outfit', sans-serif; }
                
                 .bar-chart { display: flex; align-items: flex-end; justify-content: space-between; height: 180px; padding: 20px 0; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); }
                 .bar-wrap { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 12px; height: 100%; position: relative; }
                 .bar { width: 32px; max-width: 40px; background: linear-gradient(to top, #c9a84c, #e8c96d); border-radius: 6px 6px 2px 2px; min-height: 4px; transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 4px 15px rgba(201, 168, 76, 0.2); }
                 .bar:hover { filter: brightness(1.2); transform: scaleX(1.1); }
                 .bar-label { font-size: 10px; font-weight: 900; color: #475569; margin-top: 4px; }

              `}</style>



        {/* MODAL: NOVO PEDIDO MANUAL */}

        {isAddingOrder && (

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

            <div className="absolute inset-0 bg-[#0d0d1a]/80 backdrop-blur-xl animate-in fade-in" onClick={() => setIsAddingOrder(false)} />

            <div className="bg-[#111827] w-full max-w-2xl rounded-[14px] shadow-3xl relative overflow-hidden border border-[#c9a84c]/20 animate-in zoom-in">

              <div className="p-14 border-b border-[#c9a84c]/10 flex items-center justify-between bg-[#1a1a2e]/40">

                <div>

                  <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter font-heading leading-none mb-2">Novo Pedido Manual</h3>

                  <p className="text-[10px] font-bold text-[#c9a84c] uppercase tracking-[0.3em] italic">Cadastre uma venda direta</p>

                </div>

                <button onClick={() => setIsAddingOrder(false)} className="p-4 text-slate-400 hover:text-[#c9a84c] rounded-2xl transition-all border border-white/5"><X size={24} /></button>

              </div>



              <div className="p-14 space-y-10 max-h-[60vh] overflow-y-auto custom-scrollbar">

                <div className="space-y-4">

                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Selecione o Cliente</label>

                  <select 

                    value={newOrder.clienteId} 

                    onChange={(e) => setNewOrder({ ...newOrder, clienteId: e.target.value })}

                    className="w-full bg-[#0d0d1a] p-6 rounded-[14px] border border-white/5 outline-none focus:border-[#c9a84c]/40 text-white font-black uppercase italic"

                  >

                    <option value="">Escolha um cliente...</option>

                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}

                  </select>

                </div>



                <div className="space-y-4">

                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Manto / Itens do Pedido</label>

                  <textarea 

                    rows={3}

                    onChange={(e) => setNewOrder({ ...newOrder, items: [{ nome: e.target.value, quantidade: 1, preco: 0 }] })}

                    placeholder="Ex: Camisa Flamengo G, Camisa Real Madrid M..."

                    className="w-full bg-[#0d0d1a] p-6 rounded-[14px] border border-white/5 outline-none focus:border-[#c9a84c]/40 text-white font-bold italic"

                  />

                </div>

              </div>



              <div className="p-14 bg-[#0d0d1a]/50">

                <button onClick={createOrder} className="w-full bg-[#c9a84c] py-7 rounded-[14px] text-black font-black uppercase text-xs tracking-[0.3em] shadow-3xl shadow-[#c9a84c]/20 hover:scale-[1.02] transition-all font-heading italic">

                  Finalizar Cadastro de Pedido

                </button>

              </div>

            </div>

          </div>

        )}

      </main>

    </div>

  );

}







