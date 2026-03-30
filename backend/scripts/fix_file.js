const fs = require('fs');
const path = 'd:\\saas-crm\\frontend\\src\\app\\admin\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix the missing )} before WhatsApp tab
content = content.replace(
  /<\/table>\s+<\/div>\s+<\/div>\s+<\/div>\s+\{\/\* Tab: WhatsApp \*\/\}/,
  '</table>\n                 </div>\n              </div>\n           </div>\n        )}\n\n         {/* Tab: WhatsApp */}'
);

// Add file upload to Add Product modal
content = content.replace(
  /<label className="text-\[10px\] font-black text-slate-400 uppercase tracking-widest block mb-2">URL Foto Principal<\/label>\s+<input type="text" onChange=\{\(e\) => setNewProduct\(\{\.\.\.newProduct, fotoPrincipal: e\.target\.value\}\)\} className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-primary transition-all font-bold" \/>/,
  '<label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">URL Foto ou Carregar</label>\n                        <div className="flex gap-2">\n                           <input type="text" value={newProduct.fotoPrincipal} onChange={(e) => setNewProduct({...newProduct, fotoPrincipal: e.target.value})} className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-primary transition-all font-bold text-xs" />\n                           <label className="cursor-pointer bg-slate-900 text-white p-4 rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all">\n                              <Camera size={20} />\n                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, true)} />\n                           </label>\n                        </div>'
);

fs.writeFileSync(path, content);
console.log('File updated successfully');
