const fs = require('fs');
const path = 'd:\\saas-crm\\frontend\\src\\app\\loja\\[slug]\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add states
if (!content.includes('showCheckoutForm')) {
  content = content.replace(
    /const \[paymentData, setPaymentData\] = useState<any>\(null\);/,
    'const [paymentData, setPaymentData] = useState<any>(null);\n  const [showCheckoutForm, setShowCheckoutForm] = useState(false);\n  const [customerInfo, setCustomerInfo] = useState({ nome: "", telefone: "" });'
  );
}

// Add handleCheckout function
const handleCheckout = `
  const handleCheckout = async () => {
    if (!customerInfo.nome || !customerInfo.telefone) {
      alert("Por favor, preencha seu nome e WhatsApp para continuar.");
      return;
    }

    try {
      // Registrar cliente no CRM
      await fetch("http://localhost:3001/api/clientes/checkout-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: customerInfo.nome,
          telefone: customerInfo.telefone,
          empresaId: loja.empresa.id
        })
      });

      // Abrir WhatsApp
      const message = \`Olá! Sou *$\{customerInfo.nome\}* e acabei de montar meu carrinho na loja *$\{loja.empresa.nome\}*:\\n\\n$\{cart.map(i => \`- $\{i.produto.nome\} (R$ $\{parseFloat(i.preco_venda).toFixed(2)\})\`).join('\\n')\}\\n\\n*Total: R$ $\{cart.reduce((a, b) => a + parseFloat(b.preco_venda), 0).toFixed(2)\}*\`;
      const phone = loja.empresa.whatsapp_numero || "5521981496911";
      window.open(\`https://wa.me/$\{phone\}?text=$\{encodeURIComponent(message)\}\`, "_blank");
      
      setShowCheckoutForm(false);
      setIsCartOpen(false);
    } catch (err) {
      console.error("Erro no checkout:", err);
      whatsappCheckout();
    }
  };
`;

if (!content.includes('const handleCheckout =')) {
  content = content.replace(
    /const whatsappCheckout = \(\) => \{/,
    handleCheckout + '\n  const whatsappCheckout = () => {'
  );
}

// Update Cart button to open form instead of direct WA
content = content.replace(
  /onClick=\{whatsappCheckout\}/g,
  'onClick={() => setShowCheckoutForm(true)}'
);

// Add Checkout Form Modal
const checkoutFormModal = `
      {/* Checkout Form Modal */}
      {showCheckoutForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowCheckoutForm(false)} />
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl relative max-w-md w-full animate-in zoom-in">
             <button onClick={() => setShowCheckoutForm(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors">
                <X size={24} />
             </button>
             <div className="w-16 h-16 grad-primary rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl">
                <UserPlus size={32} />
             </div>
             <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">Finalizar Pedido</h3>
             <p className="text-slate-400 mb-8 font-medium text-sm italic uppercase tracking-widest">Preencha seus dados para gerarmos seu pedido.</p>
             <div className="space-y-4">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Seu Nome Completo</label>
                   <input 
                      type="text" 
                      placeholder="Como podemos te chamar?" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                      value={customerInfo.nome}
                      onChange={(e) => setCustomerInfo({...customerInfo, nome: e.target.value})}
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Seu WhatsApp</label>
                   <input 
                      type="text" 
                      placeholder="Ex: 5521999999999" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                      value={customerInfo.telefone}
                      onChange={(e) => setCustomerInfo({...customerInfo, telefone: e.target.value})}
                   />
                </div>
                <button 
                  onClick={handleCheckout}
                  className="w-full grad-primary py-5 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl shadow-primary/30 mt-4 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                   <MessageSquare size={20} /> Concluir via WhatsApp
                </button>
             </div>
          </div>
        </div>
      )}
`;

if (!content.includes('{/* Checkout Form Modal */}')) {
  content = content.replace(
    /\{showAuthModal && \(/,
    checkoutFormModal + '\n      {showAuthModal && ('
  );
}

fs.writeFileSync(path, content);
console.log('Shop page updated successfully');
