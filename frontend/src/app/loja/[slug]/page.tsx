'use client';

import { useState, useEffect, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingCart, Search, Info, X, ChevronRight, ChevronLeft, Menu, User, UserPlus, LogIn, Trophy, Package, Instagram, ShieldCheck, MapPin, Shirt, Maximize2, CheckCircle2, MessageSquare, Loader2, Copy, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { fetchLoja, criarPedido } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function StorefrontPage({ params }: PageProps) {
  const { slug } = use(params);
  const [loja, setLoja] = useState<any>(null);
  const [loading, setLoading] = useState(true);
   const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTeam, setActiveTeam] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<any[]>([]);

  // Auth states (Placeholder for now)
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'register' | null>(null);

  const [paymentData, setPaymentData] = useState<any>(null);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [customerInfo, setCustomerInfo] = useState({ 
    nome: "", 
    telefone: "", 
    email: '', 
    password: '', 
    cpf: '', 
    cep: '', 
    logradouro: '', 
    numero: '', 
    complemento: '', 
    bairro: '', 
    cidade: '', 
    estado: '' 
  });
  const [selectedSizes, setSelectedSizes] = useState<{[key: string]: number}>({});
  const [isLogged, setIsLogged] = useState(false);
  const [expandedCats, setExpandedCats] = useState<string[]>([]);
  const [expandedTeams, setExpandedTeams] = useState<string[]>([]);
  const [expandedModels, setExpandedModels] = useState<string[]>([]);

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

  const SIZES = ['P', 'M', 'G', 'GG', 'XG'];

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchLoja(slug);
        setLoja(data);
        setLoading(false);

        // Se a loja estiver inativa, gerar cobrança simulada
        if (data && !data.empresa.faturamento_ativo) {
           const resPay = await fetch(`${API_URL}/api/pagamentos/gerar-cobranca`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ empresaId: data.empresa.id, valor: 97.00 })
           });
           if (resPay.ok) setPaymentData(await resPay.json());
        }
      } catch (err) {
        console.error('Erro ao carregar loja:', err);
      }
    }
    loadData();
  }, [slug]);

  // Auto-expand hierarchy when filters are used
  useEffect(() => {
    if (activeCategory) {
      if (!expandedCats.includes(activeCategory)) {
        setExpandedCats(prev => [...prev, activeCategory]);
      }
    }
    if (activeTeam && activeCategory) {
      const teamId = `${activeCategory}-${activeTeam}`;
      if (!expandedTeams.includes(teamId)) {
        setExpandedTeams(prev => [...prev, teamId]);
      }
    }
  }, [activeCategory, activeTeam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="font-bold uppercase italic tracking-tight text-slate-400">Carregando Vitrine...</p>
      </div>
    );
  }

  // Organizar categorias e times (Agrupamento Inteligente)
  const categories: any = {};
  loja?.produtos?.forEach((p: any) => {
    const catName = p.produto.time.liga.categoria.nome;
    const rawTeam = (p.time_nome_customizado || p.produto.time.nome || 'Outros').toUpperCase();
    
    // Limpeza de variações (RETRÔ, AWAY, etc) para agrupar no menu
    let teamName = rawTeam.replace(/JERSEY|RETRÔ|RETRO|PLAYER|HOME|AWAY|THIRD|WOMEN|FEMININA|INFANTIL|KIDS|TRAINING|JOGADOR/g, '').trim();
    
    // Consolidar times equivalentes
    if (teamName.includes('ATLÉTICO MINEIRO')) teamName = 'ATLÉTICO MINEIRO';
    if (teamName.includes('ATLÉTICO PARANAENSE')) teamName = 'ATHLETICO PR';
    if (teamName.includes('CORINTHIANS')) teamName = 'CORINTHIANS';
    if (teamName.includes('FLAMENGO')) teamName = 'FLAMENGO';

    if (!categories[catName]) categories[catName] = { nome: catName, teams: {} };
    if (!categories[catName].teams[teamName]) {
      categories[catName].teams[teamName] = {
        displayName: teamName,
        variations: new Set([p.produto.time.nome])
      };
    } else {
      categories[catName].teams[teamName].variations.add(p.produto.time.nome);
    }
  });

  const categoryList = Object.keys(categories).sort();
  
  const filteredProducts = loja?.produtos?.filter((p: any) => {
    const matchesCategory = activeCategory === null || p.produto.time.liga.categoria.nome === activeCategory;
    
    let matchesTeam = true;
    if (activeTeam) {
       const teamName = (p.time_nome_customizado || p.produto.time.nome || '').toUpperCase();
       matchesTeam = teamName.includes(activeTeam.toUpperCase());
    }

    let matchesModel = true;
    if (activeModel) {
       const model = getModelLabel(p.produto.nome);
       matchesModel = model === activeModel;
    }

    const matchesSearch = p.produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.produto.time.nome.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesTeam && matchesModel && matchesSearch;
  });

  const addToCart = (product: any) => {
    const itemsToAdd = Object.entries(selectedSizes)
      .filter(([_, qty]) => qty > 0)
      .map(([size, qty]) => ({
        ...product,
        tamanho: size,
        quantidade: qty,
        cartId: `${product.id}-${size}-${Date.now()}`
      }));

    if (itemsToAdd.length === 0) {
      alert("Selecione pelo menos um tamanho e quantidade.");
      return;
    }

    setCart([...cart, ...itemsToAdd]);
    setSelectedProduct(null);
    setSelectedSizes({});
    setIsCartOpen(true);
  };

  
  const handleCheckout = async () => {
    if (!customerInfo.nome || !customerInfo.telefone) {
      alert("Por favor, preencha seu nome e WhatsApp para continuar.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/pedidos/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId: loja.empresa.id,
          cliente: customerInfo,
          itens: cart.map(i => ({
             id: i.produto.id,
             nome: i.produto.nome,
             tamanho: i.tamanho,
             quantidade: i.quantidade,
             preco: parseFloat(i.preco_venda)
          })),
          total: cart.reduce((a, b) => a + (parseFloat(b.preco_venda) * b.quantidade), 0)
        })
      });

      if (!res.ok) throw new Error("Erro ao registrar pedido");

      const orderData = await res.json();
      const numPedido = orderData.pedido.numero_pedido;

      const itemsList = cart.map(i => `- ${i.produto.nome} [TAM: ${i.tamanho}] x${i.quantidade} (R$ ${(parseFloat(i.preco_venda) * i.quantidade).toFixed(2)})`).join('\n');
      const totalCost = cart.reduce((a, b) => a + (parseFloat(b.preco_venda) * b.quantidade), 0).toFixed(2);
      const enderecoStr = `${customerInfo.logradouro}, ${customerInfo.numero} - ${customerInfo.bairro}, ${customerInfo.cidade}/${customerInfo.estado}`;
      
      const message = `🚨 *NOVO PEDIDO: ${numPedido}*\n\nOlá! Sou *${customerInfo.nome}* e acabei de montar meu pedido na loja *${loja.empresa.nome}*:\n\n${itemsList}\n\n*Total a Pagar: R$ ${totalCost}*\n\n*Endereço de Entrega:* ${enderecoStr}\n\n_Aguardando instruções para pagamento._`;
      const phone = loja.empresa.whatsapp_numero || "5521981496911";
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
      
      setOrderSuccess({
        numero: numPedido,
        total: totalCost,
        pix: loja.empresa.pix_key || "24.366.922/0001-85", // Fallback to platform pix if store hasn't set one
        cliente: customerInfo.nome
      });

      setShowCheckoutForm(false);
      setIsCartOpen(false);
      setCart([]);
      // Não damos alert aqui, o modal de sucesso vai aparecer

    } catch (err) {
      console.error("Erro no checkout:", err);
      whatsappCheckout();
    }
  };

  const handleCustomerAuth = async () => {
    const isLogin = showAuthModal === 'login';
    const endpoint = isLogin ? 'login' : 'register';
    
    try {
       const res = await fetch(`${API_URL}/api/clientes/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             ...customerInfo,
             empresaId: loja.empresa.id
          })
       });
       const data = await res.json();
       if (data.success) {
          setIsLogged(true);
          if (isLogin) setCustomerInfo(data.cliente);
          setShowAuthModal(null);
          alert(isLogin ? `Bem-vindo de volta, ${data.cliente.nome}!` : "Cadastro realizado com sucesso! Faça login agora.");
       } else {
          alert(data.error || "Erro na autenticação");
       }
    } catch (err) { alert("Falha ao conectar com o servidor"); }
  };

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
         setCustomerInfo(prev => ({
            ...prev,
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf
         }));
      }
    } catch (e) { console.error("Erro CEP", e); }
  };

  const whatsappCheckout = () => {
    const itemsList = cart.map(i => `- ${i.produto.nome} (R$ ${parseFloat(i.preco_venda).toFixed(2)})`).join('\n');
    const total = cart.reduce((a, b) => a + parseFloat(b.preco_venda), 0).toFixed(2);
    const message = `Olá! Quero fazer o pedido na loja ${loja.empresa.nome}:\n\n${itemsList}\n\nTotal: R$ ${total}\n\nEndereço: ${customerInfo.logradouro}, ${customerInfo.numero}`;
    const phone = loja.empresa.whatsapp_numero || '5521981496911';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loja && !loja.empresa.faturamento_ativo) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 grad-primary opacity-20 blur-[150px] -translate-y-1/2" />
        
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 w-full max-w-2xl rounded-3xl p-12 text-center relative z-10 shadow-2xl animate-in zoom-in duration-500">
           <div className="w-24 h-24 grad-primary rounded-2xl flex items-center justify-center text-white mx-auto mb-10 shadow-2xl shadow-primary/40 rotate-12">
              <ShieldCheck size={48} />
           </div>
           
           <h1 className="text-4xl lg:text-5xl font-bold text-white uppercase italic tracking-tight mb-6 leading-tight">
              Acesso <span className="text-primary">Pendente</span> <br/>
           </h1>
           
           <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-12 leading-relaxed max-w-sm mx-auto">
              Para liberar seu catálogo completo, pedidos automatizados e gestão de clientes, realize o pagamento da sua assinatura.
           </p>

           <div className="bg-white rounded-2xl p-10 mb-10 shadow-inner">
              <div className="flex flex-col items-center gap-6">
                 <div className="w-48 h-48 bg-slate-50 rounded-3xl border-2 border-slate-100 p-4 flex items-center justify-center relative">
                    <Image src={paymentData?.qr_code_base64 || "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=24.366.922/0001-85"} alt="QR PIX" width={160} height={160} className="opacity-80" />
                 </div>

                 <div className="w-full space-y-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Chave CNPJ PIX</span>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                       <code className="text-xs font-bold text-slate-600 truncate">{paymentData?.copia_e_cola || "24.366.922/0001-85"}</code>
                       <button onClick={() => {
                          navigator.clipboard.writeText(paymentData?.copia_e_cola || "24.366.922/0001-85");
                          alert("Chave CNPJ Copiada!");
                       }} className="p-3 bg-slate-950 text-white rounded-lg hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                          <Copy size={16} />
                       </button>
                    </div>
                 </div>

                 <div className="flex items-center gap-4 py-4 px-8 bg-emerald-50 rounded-2xl border border-emerald-100 mb-6">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Aguardando confirmação do pagamento</span>
                 </div>

                 <button 
                   onClick={() => window.open(`https://wa.me/5521981496911?text=${encodeURIComponent("Olá! Fiz o pagamento da minha assinatura SaaS. Segue comprovante.")}`, "_blank")}
                   className="w-full grad-primary py-4 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/30 hover:scale-105 transition-all"
                 >
                    Enviar Comprovante via WhatsApp
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
                 <CheckCircle2 size={16} className="text-primary" />
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Produtos Ilimitados</span>
              </div>
              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
                 <CheckCircle2 size={16} className="text-primary" />
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Gestão CRM Completa</span>
              </div>
           </div>

           <div className="mt-10 flex items-center justify-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
              Plataforma <span className="text-white">MANTO PRO</span> · Security System 2026
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Header Premium */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 ${loja.empresa.logo_url ? '' : 'grad-primary'} rounded-lg flex items-center justify-center text-white shadow-lg overflow-hidden relative`}>
               {loja.empresa.logo_url ? <Image src={loja.empresa.logo_url} alt="Logo" fill className="object-cover" /> : <Trophy size={20} />}
            </div>
            <div>
              <h1 className="text-lg font-bold uppercase tracking-tight leading-none" style={{ color: loja.empresa.cor_primaria || '#000000' }}>{loja.empresa.nome}</h1>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-loose">Loja Oficial do Parceiro</span>
            </div>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Sua camisa favorita aqui..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all border-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            {!isLogged ? (
               <button 
                  onClick={() => setShowAuthModal('login')}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-primary font-bold transition-all text-sm"
               >
                  <User size={18} /> Login
               </button>
            ) : (
               <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 grad-primary rounded-xl flex items-center justify-center text-white font-black text-xs italic">
                     {customerInfo.nome?.charAt(0)}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{customerInfo.nome?.split(' ')[0]}</span>
               </div>
            )}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 bg-slate-900 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/20"
            >
              <ShoppingCart size={20} />
              {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-white">{cart.length}</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* Breadcrumbs & Menu Horizontal */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
           <button onClick={() => { setActiveCategory(null); setActiveTeam(null); setActiveModel(null); }} className="hover:text-primary transition-all">HOME</button>
           {activeCategory && (
              <>
                 <ChevronRight size={12} className="opacity-50" />
                 <button onClick={() => { setActiveTeam(null); setActiveModel(null); }} className="hover:text-primary transition-all">{activeCategory}</button>
              </>
           )}
           {activeTeam && (
              <>
                 <ChevronRight size={12} className="opacity-50" />
                 <button onClick={() => { setActiveModel(null); }} className="hover:text-primary transition-all">{activeTeam}</button>
              </>
           )}
           {activeModel && (
              <>
                 <ChevronRight size={12} className="opacity-50" />
                 <span className="text-slate-900">{activeModel}</span>
              </>
           )}
        </div>

        <div className="w-full">
           <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
              <button 
                 onClick={() => { setActiveCategory(null); setActiveTeam(null); setActiveModel(null); }}
                 className={`shrink-0 px-5 py-2.5 rounded-lg font-bold uppercase text-[11px] tracking-tight transition-all flex items-center gap-2 ${!activeCategory ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'}`}
              >
                 TUDO <span className="opacity-40 text-[9px]">({loja?.produtos?.length || 0})</span>
              </button>
              {categoryList.sort().map(cat => {
                 const count = loja?.produtos?.filter((p: any) => p.produto.time.liga.categoria.nome === cat).length;
                 return (
                    <button 
                       key={cat}
                       onClick={() => { setActiveCategory(cat); setActiveTeam(null); setActiveModel(null); }}
                       className={`shrink-0 px-5 py-2.5 rounded-lg font-bold uppercase text-[11px] tracking-tight transition-all flex items-center gap-2 ${activeCategory === cat ? 'text-white shadow-md' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                       style={activeCategory === cat ? { backgroundColor: loja.empresa.cor_primaria || '#3b82f6' } : {}}
                    >
                       {cat} <span className={`text-[9px] ${activeCategory === cat ? 'opacity-70' : 'opacity-40'}`}>({count})</span>
                    </button>
                 );
              })}
           </div>

           {activeCategory && (
              <div className="flex items-center gap-2 mt-6 overflow-x-auto no-scrollbar pb-2 animate-in slide-in-from-left duration-300">
                 <button 
                    onClick={() => { setActiveTeam(null); setActiveModel(null); }}
                    className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all ${!activeTeam ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                    • VER TODOS
                 </button>
                 {Object.keys(categories[activeCategory].teams).sort().map((teamKey: any) => {
                    const count = loja?.produtos?.filter((p: any) => {
                       const matchesCategory = p.produto.time.liga.categoria.nome === activeCategory;
                       const teamName = (p.time_nome_customizado || p.produto.time.nome || '').toUpperCase();
                       return matchesCategory && teamName.includes(teamKey.toUpperCase());
                    }).length;
                    return (
                       <button 
                          key={teamKey}
                          onClick={() => { setActiveTeam(teamKey); setActiveModel(null); }}
                          className={`shrink-0 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all flex items-center gap-2 ${activeTeam === teamKey ? 'bg-slate-200 text-slate-900 border border-slate-300' : 'text-slate-400 hover:text-slate-600 bg-white border border-slate-100'}`}
                       >
                          • {categories[activeCategory].teams[teamKey].displayName} <span className="text-[9px] opacity-40">({count})</span>
                       </button>
                    );
                 })}
               </div>
            )}

            {activeTeam && (
               <div className="flex items-center gap-2 mt-2 overflow-x-auto no-scrollbar pb-2 animate-in slide-in-from-left duration-300">
                  <button 
                     onClick={() => setActiveModel(null)}
                     className={`shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight transition-all ${!activeModel ? 'bg-primary text-white' : 'text-slate-400 bg-white border border-slate-100'}`}
                  >
                      TODOS MODELOS
                  </button>
                  {['MODELO JOGADOR', 'MODELO TORCEDOR', 'MODELO FEMININO', 'MODELO INFANTIL'].map(model => {
                     const count = loja?.produtos?.filter((p: any) => {
                        const matchesCategory = p.produto.time.liga.categoria.nome === activeCategory;
                        const teamName = (p.time_nome_customizado || p.produto.time.nome || '').toUpperCase();
                        const matchesTeam = teamName.includes(activeTeam.toUpperCase());
                        const matchesModel = getModelLabel(p.produto.nome) === model;
                        return matchesCategory && matchesTeam && matchesModel;
                     }).length;
                     if (count === 0) return null;
                     return (
                        <button 
                           key={model}
                           onClick={() => setActiveModel(model)}
                           className={`shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight transition-all flex items-center gap-2 ${activeModel === model ? 'bg-primary text-white shadow-lg' : 'text-slate-400 bg-white border border-slate-100'}`}
                        >
                           {model} <span className={`text-[8px] ${activeModel === model ? 'opacity-70' : 'opacity-40'}`}>({count})</span>
                        </button>
                     );
                  })}
               </div>
            )}
         </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight leading-none mb-1">
                 {activeModel || activeTeam || activeCategory || 'Minha Loja'}
              </h2>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">{filteredProducts?.length || 0} Modelos Encontrados</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8 min-h-[400px]">
             {filteredProducts?.map((p: any) => (
                <div 
                  key={p.id} 
                  onClick={() => { setSelectedProduct(p); setActivePhotoIndex(0); }}
                  className="group bg-white rounded-2xl border border-slate-100 overflow-hidden cursor-pointer hover:shadow-xl transition-all hover:-translate-y-2 relative"
                >
                  <div className="aspect-[4/5] relative overflow-hidden bg-slate-50">
                    <Image src={p.foto_principal_customizada || p.produto.foto_principal} alt={p.produto.nome} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-100 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver Detalhes
                    </div>
                  </div>
                  <div className="p-5">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 block group-hover:tracking-[0.1em] transition-all">{p.time_nome_customizado || p.produto.time.nome}</span>
                    <h3 className="font-bold text-slate-800 text-sm leading-tight uppercase italic mb-3 line-clamp-2">{p.produto.nome}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-slate-900">R$ {parseFloat(p.preco_venda).toFixed(2)}</span>
                      <button className="p-2 bg-slate-900 text-white rounded-xl active:scale-90 transition-all opacity-0 group-hover:opacity-100 shadow-xl">
                        <ShoppingCart size={16} />
                      </button>
                    </div>
                  </div>
                </div>
             ))}

             {filteredProducts?.length === 0 && (
                <div className="col-span-full py-32 text-center opacity-20">
                  <Search size={80} className="mx-auto mb-6" />
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter">Nenhum resultado</h3>
                  <p className="font-bold">Tente mudar os filtros acima.</p>
                </div>
             )}
          </div>
      </div>
    </div>

      {/* Footer Premium */}
      <footer className="bg-white border-t border-slate-100 pt-16 pb-24 mt-20">
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 grad-primary rounded-md flex items-center justify-center text-white font-bold italic shadow-lg">M</div>
                   <span className="text-lg font-bold uppercase tracking-tight">{loja.empresa.nome}</span>
                </div>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Sua loja de camisas de time tailandesas padrão 1.1 com envio garantido e rastreio completo.
                </p>
                <div className="flex gap-4">
                   <a href="#" className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-primary transition-all"><Instagram size={18} /></a>
                   <a href="#" className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-primary transition-all"><MapPin size={18} /></a>
                </div>
              </div>

              <div>
                <h4 className="font-black uppercase italic text-sm mb-6 tracking-widest">Atendimento</h4>
                <ul className="space-y-4 text-slate-400 text-sm font-bold">
                  <li className="hover:text-primary cursor-pointer transition-colors uppercase">Falar com Consultor</li>
                  <li className="hover:text-primary cursor-pointer transition-colors uppercase">Prazo de Entrega</li>
                  <li className="hover:text-primary cursor-pointer transition-colors uppercase">Tabela de Medidas</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold uppercase italic text-sm mb-6 tracking-widest text-slate-900">Segurança</h4>
                <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                   <div className="flex items-center gap-3 text-emerald-600">
                      <ShieldCheck size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none">Pagamento SSL</span>
                   </div>
                   <div className="flex items-center gap-3 text-blue-600">
                      <ShieldCheck size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none">Envio Segurado</span>
                   </div>
                </div>
              </div>

               <div className="bg-primary p-8 rounded-xl text-white space-y-4 shadow-xl shadow-primary/20">
                  <h4 className="text-lg font-bold uppercase tracking-tight leading-tight">Ganhe Descontos</h4>
                  <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80 leading-relaxed">Cadastre-se na nossa base VIP e receba ofertas exclusivas.</p>
                  <button 
                    onClick={() => setShowAuthModal('register')}
                    className="w-full py-3.5 bg-white text-primary font-bold uppercase tracking-widest text-[10px] rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-md"
                  >
                     Cadastrar Agora
                  </button>
              </div>
          </div>
          <div className="max-w-7xl mx-auto px-8 mt-16 pt-8 border-t border-slate-50 flex justify-between items-center text-[9px] font-bold text-slate-300 uppercase tracking-widest">
             <p>© 2026 {loja.empresa.nome} · Todos os direitos reservados</p>
             <p className="flex items-center gap-1">Powered by <span className="text-slate-400">Manto PRO</span></p>
          </div>
      </footer>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl animate-in fade-in" onClick={() => setSelectedProduct(null)} />
          <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row animate-in zoom-in duration-300">
            <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 z-10 p-3 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 text-slate-400 hover:text-red-500 transition-all shadow-xl"
            >
                <X size={20} />
            </button>

            <div className="w-full md:w-[60%] bg-slate-50 relative group aspect-square md:aspect-auto">
              {(() => {
                const fotos = selectedProduct.produto.fotos || [];
                const currentPhoto = fotos[activePhotoIndex] || selectedProduct.produto.foto_principal;
                return (
                  <>
                    <Image src={currentPhoto as string} alt="" fill className="object-contain p-12 transition-all duration-700" />
                    
                    {fotos.length > 1 && (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActivePhotoIndex(prev => (prev > 0 ? prev - 1 : fotos.length - 1)); }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white/80 rounded-2xl border border-slate-200 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActivePhotoIndex(prev => (prev < fotos.length - 1 ? prev + 1 : 0)); }}
                          className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/80 rounded-2xl border border-slate-200 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                        >
                          <ChevronRight size={24} />
                        </button>
                      </>
                    )}

                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
                       {fotos.map((_: any, i: number) => (
                         <div key={i} className={`w-2 h-2 rounded-full transition-all ${activePhotoIndex === i ? 'bg-primary w-6' : 'bg-slate-300'}`} />
                       ))}
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
              <div className="mb-8">
                 <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-md">Jersey Premium</span>
                    <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">REF: {selectedProduct.produto.slug.split('-')[0].toUpperCase()}</span>
                 </div>
                 <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 uppercase tracking-tight leading-tight mb-4">{selectedProduct.produto.nome}</h2>
                 <p className="text-slate-500 font-medium leading-relaxed text-sm lg:text-base">
                    {selectedProduct.produto.descricao || 'Essa camisa oficial traz a história e a glória do time com o máximo em tecnologia de tecido. O corte é o modelo perfeito tanto para torcer quanto para jogar.'}
                 </p>
              </div>

              <div className="space-y-4 mb-8">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Selecione os Tamanhos</span>
                 <div className="grid grid-cols-1 gap-3">
                    {SIZES.map(size => (
                      <div key={size} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="font-black text-slate-700 w-8">{size}</span>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setSelectedSizes(prev => ({...prev, [size]: Math.max(0, (prev[size] || 0) - 1)}))}
                            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-lg hover:bg-slate-100 active:scale-95 transition-all text-slate-400"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-black text-slate-900">{selectedSizes[size] || 0}</span>
                          <button 
                            onClick={() => setSelectedSizes(prev => ({...prev, [size]: (prev[size] || 0) + 1}))}
                            className="w-10 h-10 rounded-xl grad-primary text-white flex items-center justify-center font-black text-lg hover:scale-105 active:scale-95 transition-all"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="bg-slate-900 rounded-3xl p-8 border border-white/5 mb-8 relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 -translate-y-12 translate-x-12 rounded-full blur-2xl" />
                 <div className="relative z-10 flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Total deste item</span>
                    <div className="flex items-end gap-2">
                       <span className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter">
                        R$ {(parseFloat(selectedProduct.preco_venda) * Object.values(selectedSizes).reduce((a, b) => a + b, 0) || parseFloat(selectedProduct.preco_venda)).toFixed(2)}
                       </span>
                       <span className="text-xs font-bold text-slate-500 mb-2 uppercase italic tracking-tighter">no PIX</span>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => addToCart(selectedProduct)}
                className="w-full grad-primary py-6 rounded-[1.5rem] text-white font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
              >
                <ShoppingCart size={24} /> Adicionar ao Carrinho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsCartOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right flex flex-col">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
               <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Seu Carrinho</h3>
               <button onClick={() => setIsCartOpen(false)} className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-red-500 transition-all shadow-lg">
                  <X size={20} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {cart.map((item, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl relative overflow-hidden shrink-0 border border-slate-100">
                    <Image src={item.produto.foto_principal} alt="" fill className="object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{item.produto.time.nome}</span>
                    <h4 className="font-black text-slate-800 text-sm italic tracking-tighter uppercase leading-tight mb-2">{item.produto.nome}</h4>
                     <div className="flex items-center justify-between">
                       <div className="flex flex-col">
                         <span className="font-black text-primary">R$ {(parseFloat(item.preco_venda) * item.quantidade).toFixed(2)}</span>
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.quantidade}x Tamanho {item.tamanho}</span>
                       </div>
                       <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase">Remover</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-200">
               <div className="flex items-center justify-between mb-8">
                  <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Total do Carrinho</span>
                  <span className="text-4xl font-black text-slate-900 italic tracking-tighter">R$ {cart.reduce((a, b) => a + (parseFloat(b.preco_venda) * b.quantidade), 0).toFixed(2)}</span>
               </div>
               <button 
                onClick={() => setShowCheckoutForm(true)}
                disabled={cart.length === 0}
                className="w-full grad-primary py-6 rounded-[1.5rem] text-white font-black uppercase text-sm tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
               >
                 <ShoppingCart size={24} /> Finalizar Via WhatsApp
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Form Modal */}
      {showCheckoutForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowCheckoutForm(false)} />
          <div className="bg-white p-8 rounded-2xl shadow-2xl relative max-w-2xl w-full animate-in zoom-in overflow-y-auto max-h-[90vh]">
             <button onClick={() => setShowCheckoutForm(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors">
                <X size={24} />
             </button>
             <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-1">Finalizar Pedido</h3>
             <p className="text-slate-400 mb-6 font-medium text-[10px] italic uppercase tracking-widest">Preencha seus dados para entrega e gerarmos seu pedido.</p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nome Completo</label>
                   <input 
                      type="text" 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                      value={customerInfo.nome}
                      onChange={(e) => setCustomerInfo({...customerInfo, nome: e.target.value})}
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">WhatsApp</label>
                   <input 
                      type="text" 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                      value={customerInfo.telefone}
                      onChange={(e) => setCustomerInfo({...customerInfo, telefone: e.target.value})}
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">CPF (Necessário para envio)</label>
                   <input 
                      type="text" 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                      value={customerInfo.cpf}
                      onChange={(e) => setCustomerInfo({...customerInfo, cpf: e.target.value})}
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">CEP</label>
                   <input 
                      type="text" 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                      value={customerInfo.cep}
                      onBlur={(e) => fetchAddressByCep(e.target.value)}
                      onChange={(e) => setCustomerInfo({...customerInfo, cep: e.target.value})}
                   />
                </div>
                <div className="md:col-span-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Endereço (Rua/Avenida)</label>
                   <input 
                      type="text" 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                      value={customerInfo.logradouro}
                      onChange={(e) => setCustomerInfo({...customerInfo, logradouro: e.target.value})}
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Número</label>
                   <input 
                      type="text" 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                      value={customerInfo.numero}
                      onChange={(e) => setCustomerInfo({...customerInfo, numero: e.target.value})}
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Complemento</label>
                   <input 
                      type="text" 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                      value={customerInfo.complemento}
                      onChange={(e) => setCustomerInfo({...customerInfo, complemento: e.target.value})}
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Bairro</label>
                   <input 
                      type="text" 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                      value={customerInfo.bairro}
                      onChange={(e) => setCustomerInfo({...customerInfo, bairro: e.target.value})}
                   />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cidade</label>
                        <input 
                            type="text" 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                            value={customerInfo.cidade}
                            onChange={(e) => setCustomerInfo({...customerInfo, cidade: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">UF</label>
                        <input 
                            type="text" 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                            value={customerInfo.estado}
                            onChange={(e) => setCustomerInfo({...customerInfo, estado: e.target.value})}
                        />
                    </div>
                </div>
             </div>

             <button 
                onClick={handleCheckout}
                className="w-full mt-8 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-[1.02] transition-all"
             >
                Confirmar e Ir para WhatsApp
             </button>
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      {orderSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl animate-in fade-in" />
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 text-center relative z-10 shadow-2xl animate-in zoom-in duration-500">
            <div className="w-20 h-20 grad-primary rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-primary/40 rotate-12">
              <CheckCircle2 size={40} />
            </div>
            
            <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">Pedido Recebido!</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-8">Protocolo: <span className="text-primary">#{orderSuccess.numero}</span></p>
            
            <div className="bg-slate-50 rounded-3xl p-8 mb-8 border border-slate-100">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Pagamento via PIX</span>
               <div className="flex flex-col items-center gap-4">
                  <div className="w-40 h-40 bg-white rounded-2xl border border-slate-200 p-3 flex items-center justify-center">
                    <Image 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${orderSuccess.pix}`} 
                      alt="QR PIX" width={140} height={140} 
                    />
                  </div>
                  <div className="w-full">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chave PIX (CNPJ/E-mail)</p>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2 overflow-hidden">
                       <code className="text-[10px] font-bold text-slate-600 truncate">{orderSuccess.pix}</code>
                       <button onClick={() => {
                          navigator.clipboard.writeText(orderSuccess.pix);
                          alert("Copiado!");
                       }} className="p-2 bg-slate-900 text-white rounded-lg">
                          <Copy size={14} />
                       </button>
                    </div>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => {
                  const message = `Olá! Fiz o pedido #${orderSuccess.numero} e estou enviando o comprovante do PIX de R$ ${orderSuccess.total}.`;
                  const phone = loja.empresa.whatsapp_numero || "5521981496911";
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
                }}
                className="w-full grad-primary py-4 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/30"
              >
                Enviar Comprovante WhatsApp
              </button>
              <button 
                onClick={() => setOrderSuccess(null)}
                className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors"
              >
                Voltar para Loja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAuthModal(null)} />
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl relative max-w-md w-full animate-in zoom-in">
             <button onClick={() => setShowAuthModal(null)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-all">
                <X size={24} />
             </button>
             
             <div className="text-center mb-8">
                <div className="w-16 h-16 grad-primary rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl rotate-6">
                   {showAuthModal === 'login' ? <LogIn size={32} /> : <UserPlus size={32} />}
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
                   {showAuthModal === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
                </h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">
                   {showAuthModal === 'login' ? 'Acesse seus pedidos e dados' : 'Faça parte da nossa base VIP'}
                </p>
             </div>

             <div className="space-y-4">
                {showAuthModal === 'register' && (
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nome Completo</label>
                      <input 
                         type="text" 
                         className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                         placeholder="Seu nome"
                         value={customerInfo.nome}
                         onChange={(e) => setCustomerInfo({...customerInfo, nome: e.target.value})}
                      />
                   </div>
                )}
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">E-mail</label>
                   <input 
                      type="email" 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                      placeholder="seu@email.com"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Senha</label>
                   <input 
                      type="password" 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                      placeholder="••••••••"
                      value={customerInfo.password}
                      onChange={(e) => setCustomerInfo({...customerInfo, password: e.target.value})}
                   />
                </div>
                
                <button 
                   onClick={handleCustomerAuth}
                   className="w-full py-5 grad-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                >
                   {showAuthModal === 'login' ? 'Entrar Agora' : 'Finalizar Cadastro'}
                </button>

                <div className="text-center mt-6">
                   <button 
                      onClick={() => setShowAuthModal(showAuthModal === 'login' ? 'register' : 'login')}
                      className="text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-widest transition-colors"
                   >
                      {showAuthModal === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça Login'}
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
