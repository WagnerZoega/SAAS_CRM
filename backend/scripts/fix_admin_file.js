const fs = require('fs');
const content = fs.readFileSync('d:/saas-crm/frontend/src/app/admin/page.tsx', 'utf8');

// The problematic block is around line 628-664 according to view_file
// It looks like:
//          {/* Tab: WhatsApp */}
//          {activeTab === 'whatsapp' && (
//            <div className="space-y-12 animate-in fade-in duration-500 text-center py-12">
//               ...
//          )}

// I need to find EXACTLY what's there and fix it.
// I will try to use a more robust replacement using regex if needed, but first let's just use part of the string.

const target = `{/* Tab: WhatsApp */}
         {activeTab === 'whatsapp' && (
           <div className="space-y-12 animate-in fade-in duration-500 text-center py-12">
              <div className="max-w-xl mx-auto bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl">
                 <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <MessageCircle size={40} />
                 </div>
                 <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">Conexão Inteligente</h2>
                 <p className="text-slate-400 font-medium text-sm mb-10 text-pretty">
                    Conecte sua API Evolution para automatizar o envio de pedidos e notificações para seus clientes via WhatsApp.
                 </p>

                 {waStatus?.instance?.state === 'open' ? (
                    <div className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                       <div className="flex items-center justify-center gap-3 text-emerald-600 font-black uppercase tracking-widest text-xs">
                          <CheckCircle2 size={16} /> WhatsApp Conectado
                       </div>
                    </div>
                 ) : (
                    <div className="space-y-8">
                       {qrCode ? (
                          <div className="flex flex-col items-center gap-6">
                             <div className="p-4 bg-white border-4 border-slate-100 rounded-3xl shadow-inner">
                                <Image src={qrCode} alt="WhatsApp QR" width={250} height={250} />
                             </div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Escaneie com seu Celular agora</p>
                          </div>
                       ) : (
                          <button onClick={connectWhatsApp} className="w-full bg-[#25D366] text-white py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-green-500/30 hover:scale-105 active:scale-95 transition-all">
                             Gerar QR Code de Conexão
                          </button>
                       )}
                    </div>
                 )}
              </div>
           </div>
         )}
`;

const replacement = `{/* Tab: WhatsApp */}
         {activeTab === 'whatsapp' && (
           <div className="space-y-12 animate-in fade-in duration-500 text-center py-12">
              <div className="max-w-xl mx-auto bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl">
                 <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <MessageCircle size={40} />
                 </div>
                 <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">Conexão Inteligente</h2>
                 <p className="text-slate-400 font-medium text-sm mb-10 text-pretty">
                    Conecte sua API Evolution para automatizar o envio de pedidos e notificações para seus clientes via WhatsApp.
                 </p>

                 {waStatus?.instance?.state === 'open' ? (
                    <div className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                       <div className="flex items-center justify-center gap-3 text-emerald-600 font-black uppercase tracking-widest text-xs">
                          <CheckCircle2 size={16} /> WhatsApp Conectado
                       </div>
                    </div>
                 ) : (
                    <div className="space-y-8">
                       {qrCode ? (
                          <div className="flex flex-col items-center gap-6">
                             <div className="p-4 bg-white border-4 border-slate-100 rounded-3xl shadow-inner">
                                <Image src={qrCode} alt="WhatsApp QR" width={250} height={250} />
                             </div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Escaneie com seu Celular agora</p>
                          </div>
                       ) : (
                          <button onClick={connectWhatsApp} className="w-full bg-[#25D366] text-white py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-green-500/30 hover:scale-105 active:scale-95 transition-all">
                             Gerar QR Code de Conexão
                          </button>
                       )}
                    </div>
                 )}
              </div>
           </div>
         )}
`;

// It seems there is a subtle whitespace or character difference.
// Let's use a simpler approach. Search for the block starting with {/* Tab: WhatsApp */} until the first )} after it.

const startMarker = '{/* Tab: WhatsApp */}';
const startIndex = content.indexOf(startMarker);
if (startIndex === -1) {
    console.error('Marker not found');
    process.exit(1);
}

// Find the closure of the and block
let braceCount = 0;
let parenthesisCount = 0;
let foundEnd = -1;

for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') braceCount--;
    if (content[i] === '(') parenthesisCount++;
    if (content[i] === ')') parenthesisCount--;
    
    if (content.substr(i, 2) === ')}' && braceCount === 0 && parenthesisCount === 0) {
        foundEnd = i + 2;
        break;
    }
}

if (foundEnd === -1) {
    // Try a simpler way
    const part = content.substr(startIndex, 1000);
    const match = part.match(/\\}\\)\\s*\\}\\s*\\)\\s*;/); // This looks like what I accidentally did if there's a semicolon
    // Actually, looking at the view_file, it ends with )} at 664.
    const endIdx = content.indexOf(')}', startIndex + 500); // Look further ahead
    if (endIdx !== -1) {
        foundEnd = endIdx + 2;
    }
}

if (foundEnd !== -1) {
    const newContent = content.substring(0, startIndex) + replacement + content.substring(foundEnd);
    fs.writeFileSync('d:/saas-crm/frontend/src/app/admin/page.tsx', newContent);
    console.log('Successfully fixed the file');
} else {
    console.error('Could not find end of block');
    process.exit(1);
}
