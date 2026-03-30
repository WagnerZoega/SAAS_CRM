const fs = require('fs');
const path = 'd:\\saas-crm\\frontend\\src\\app\\loja\\[slug]\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update validation label
content = content.replace(
  /<span className="text-\[10px\] font-black text-emerald-600 uppercase tracking-widest">Aguardando Confirmação Automática<\/span>/,
  '<span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Aguardando confirmação do pagamento</span>'
);

// Add "Send Proof" button
const sendProofButton = `
                  <button 
                    onClick={() => {
                      const message = encodeURIComponent("Olá! Acabei de realizar o pagamento da minha assinatura SaaS. Segue o comprovante.");
                      window.open(\`https://wa.me/5521981496911?text=$\{message\}\`, "_blank");
                    }} 
                    className="w-full grad-primary py-4 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/30 hover:scale-105 transition-all mt-4"
                  >
                     Enviar Comprovante via WhatsApp
                  </button>
`;

content = content.replace(
  /<\/div>\s+<\/div>\s+<\/div>\s+<div className="grid grid-cols-2 gap-4 mb-8">/,
  (match) => sendProofButton + '\n               </div>\n            </div>\n\n            <div className="grid grid-cols-2 gap-4 mb-8">'
);

fs.writeFileSync(path, content);
console.log('SaaS Block screen updated for manual mode');
