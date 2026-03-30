const fs = require('fs');
const path = 'd:\\saas-crm\\frontend\\src\\app\\loja\\[slug]\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Ensure the file ends with a single newline
content = content.trim() + '\n';

// Fix the possibly broken button in the block screen
// Make sure every { has a corresponding }
// Re-write the block screen return to be very clean

const startBlock = content.indexOf('if (loja && !loja.empresa.faturamento_ativo) {');
const endBlock = content.indexOf('return (', startBlock + 40); // the start of the main return

if (startBlock > -1 && endBlock > -1) {
    const blockContent = content.substring(startBlock, endBlock);
    // Let's replace the whole if block until the next return
    const newIfBlock = `if (loja && !loja.empresa.faturamento_ativo) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 grad-primary opacity-20 blur-[150px] -translate-y-1/2" />
        
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 w-full max-w-2xl rounded-[3.5rem] p-12 text-center relative z-10 shadow-2xl animate-in zoom-in duration-500">
           <div className="w-24 h-24 grad-primary rounded-[2.5rem] flex items-center justify-center text-white mx-auto mb-10 shadow-2xl shadow-primary/40 rotate-12">
              <ShieldCheck size={48} />
           </div>
           
           <h1 className="text-4xl lg:text-5xl font-black text-white uppercase italic tracking-tighter mb-6 leading-tight">
              Acesso <span className="text-primary">Pendente</span> <br/>
           </h1>
           
           <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-12 leading-relaxed max-w-sm mx-auto">
              Para liberar seu catálogo completo, pedidos automatizados e gestão de clientes, realize o pagamento da sua assinatura.
           </p>

           <div className="bg-white rounded-[2.5rem] p-10 mb-10 shadow-inner">
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

                 <div className="flex items-center gap-4 py-4 px-8 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Aguardando confirmação do pagamento</span>
                 </div>

                 <button 
                   onClick={() => window.open(\`https://wa.me/5521981496911?text=\${encodeURIComponent("Olá! Fiz o pagamento da minha assinatura SaaS. Segue comprovante.")}\`, "_blank")}
                   className="w-full grad-primary py-4 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/30 hover:scale-105 transition-all mt-2"
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

  `;
    content = content.substring(0, startBlock) + newIfBlock + content.substring(endBlock);
}

fs.writeFileSync(path, content);
console.log('Fixed syntax error in StorefrontPage');
