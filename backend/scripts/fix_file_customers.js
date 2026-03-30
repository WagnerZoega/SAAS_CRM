const fs = require('fs');
const path = 'd:\\saas-crm\\frontend\\src\\app\\admin\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add "Novo Cliente" button
content = content.replace(
  /<div className="p-10 border-b border-slate-100 flex justify-between items-center">\s+<h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Minha Comunidade<\/h3>\s+<span className="px-6 py-2 bg-slate-100 rounded-xl text-\[10px\] font-black text-slate-400 uppercase tracking-widest">\{dashboardData\?\.clientes\?\.length \|\| 0\} Clientes Ativos<\/span>\s+<\/div>/,
  '<div className="p-10 border-b border-slate-100 flex justify-between items-center bg-white">\n                  <div>\n                    <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Minha Comunidade</h3>\n                    <span className="px-6 py-2 bg-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">{dashboardData?.clientes?.length || 0} Clientes Ativos</span>\n                  </div>\n                  <button \n                    onClick={() => setIsAddingCustomer(true)}\n                    className="grad-primary px-8 py-4 rounded-2xl text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/30 hover:scale-105 transition-all flex items-center gap-2"\n                  >\n                    <Plus size={18} /> Novo Cliente\n                  </button>\n               </div>'
);

// Add Add Customer Modal
const addCustomerModal = `
       {/* MODAL: Add Customer */}
       {isAddingCustomer && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsAddingCustomer(false)} />
            <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in">
               <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-950 uppercase italic tracking-tighter">Novo Cliente</h3>
                  <button onClick={() => setIsAddingCustomer(false)} className="p-3 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-all"><X size={24} /></button>
               </div>
               
               <div className="p-10 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nome Completo</label>
                       <input type="text" onChange={(e) => setNewCustomer({...newCustomer, nome: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-primary transition-all font-bold" />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">WhatsApp</label>
                       <input type="text" placeholder="Ex: 552199999999" onChange={(e) => setNewCustomer({...newCustomer, telefone: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-primary transition-all font-bold" />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Email</label>
                       <input type="email" onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-primary transition-all font-bold" />
                    </div>
                    <div>
                       <label className="text-[10px) font-black text-slate-400 uppercase tracking-widest block mb-2">Cidade</label>
                       <input type="text" onChange={(e) => setNewCustomer({...newCustomer, cidade: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-primary transition-all font-bold" />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Estado (UF)</label>
                       <input type="text" maxLength={2} onChange={(e) => setNewCustomer({...newCustomer, estado: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-primary transition-all font-bold uppercase" />
                    </div>
                  </div>
                  <button onClick={createCustomer} className="w-full grad-primary py-5 rounded-2xl text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/30 mt-6">
                     Cadastrar Cliente no CRM
                  </button>
               </div>
            </div>
         </div>
       )}
`;

content = content.replace(
  /(\s+)\{isAddingProduct && \(/,
  (match, p1) => addCustomerModal + p1 + '{isAddingProduct && ('
);

fs.writeFileSync(path, content);
console.log('Admin page updated successfully');
