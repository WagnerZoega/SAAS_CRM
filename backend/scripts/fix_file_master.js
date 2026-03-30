const fs = require('fs');
const path = 'd:\\saas-crm\\frontend\\src\\app\\master-admin\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add Trash2 import
content = content.replace(
  /Edit3 \} from 'lucide-react'/,
  'Edit3, Trash2 } from "lucide-react"'
);

// Add deletePartner function
const deletePartnerFunc = `
    const deletePartner = async (id: number) => {
        if (!confirm("🚨 TEM CERTEZA? Isso excluirá permanentemente este parceiro e todos os seus dados (clientes, pedidos, configurações).")) return;
        
        const token = localStorage.getItem('master_token');
        try {
            const res = await fetch(\`http://localhost:3001/api/admin/master/parceiro/$\{id\}\`, {
                method: 'DELETE',
                headers: { 'Authorization': \`Bearer $\{token\}\` }
            });
            
            if (res.ok) {
                alert("Parceiro excluído com sucesso!");
                fetchPartners();
            } else {
                alert("Erro ao excluir parceiro.");
            }
        } catch (err) {
            console.error(err);
            alert("Erro de conexão ao excluir.");
        }
    };
`;

content = content.replace(
  /export default function MasterAdminPage\(\) \{/,
  'export default function MasterAdminPage() {\n' + deletePartnerFunc
);

// Add delete button to table
content = content.replace(
  /<ExternalLink size=\{20\} \/>\s+<\/Link>\s+<\/div>/,
  '<ExternalLink size={20} />\n                                     </Link>\n                                     <button \n                                         onClick={() => deletePartner(c.id)}\n                                         className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-red-500 transition-all shadow-sm"\n                                         title="Excluir Parceiro"\n                                     >\n                                         <Trash2 size={20} />\n                                     </button>\n                                 </div>'
);

fs.writeFileSync(path, content);
console.log('Master admin page updated successfully');
