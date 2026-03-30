const fs = require('fs');
const path = 'd:\\saas-crm\\frontend\\src\\app\\loja\\[slug]\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update the PIX display in the block screen
content = content.replace(
  /<span className="text-\[10px\] font-black text-slate-400 uppercase tracking-widest block">Chave PIX \(Copia e Cola\)<\/span>/,
  '<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Chave CNPJ PIX</span>'
);

content = content.replace(
  /<code className="text-xs font-bold text-slate-600 truncate">\{paymentData\?\.copia_e_cola \|\| "CARREGANDO_PIX_\.\.\."\}<\/code>/,
  '<code className="text-xs font-bold text-slate-600 truncate">{paymentData?.copia_e_cola || "24.366.922/0001-85"}</code>'
);

content = content.replace(
  /alert\("Chave Copiada!"\);/,
  'alert("Chave CNPJ Copiada!");'
);

content = content.replace(
  /navigator\.clipboard\.writeText\(paymentData\?\.copia_e_cola \|\| ""\);/,
  'navigator.clipboard.writeText(paymentData?.copia_e_cola || "24.366.922/0001-85");'
);

content = content.replace(
  /"https:\/\/api\.qrserver\.com\/v1\/create-qr-code\/\?size=200x200&data=00020126360014br\.gov\.bcb\.pix0114SUACHAVEPIX02"/,
  '"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=24.366.922/0001-85"'
);

fs.writeFileSync(path, content);
console.log('SaaS Block screen PIX updated');
