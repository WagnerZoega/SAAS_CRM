const fs = require('fs');
const path = 'd:\\saas-crm\\backend\\src\\routes\\adminCatalog.js';
let content = fs.readFileSync(path, 'utf8');

// Improvement: Debug log exactly what is received
content = content.replace(
  /console\.log\(\`\[CATALOG_UPDATE_DEBUG\] Empresa: \$\{req\.empresaId\}, Produto: \$\{produtoId\}, Nome: \$\{nomeCustomizado\}\`\);/,
  "console.log(`[CATALOG_UPDATE_DEBUG] Payload:`, req.body);\n  const logFile = 'catalog_debug.json';\n  fs.appendFileSync(logFile, JSON.stringify({ timestamp: new Date(), empresaId: req.empresaId, body: req.body }) + '\\n');"
);

// Improvement: Handle potential NaN and nulls
content = content.replace(
  /update: \{/,
  `update: {
        preco_venda: parseFloat(precoVenda) || 0,
        margem: parseFloat(margem) || 0,
        ativo: ativo !== false,
        nome_customizado: nomeCustomizado || null,
        descricao_customizada: descricaoCustomizada || null,
        time_nome_customizado: timeNomeCustomizado || null
      },`
);

content = content.replace(
  /create: \{/,
  `create: {
        empresa_id: req.empresaId,
        produto_id: parseInt(produtoId),
        preco_venda: parseFloat(precoVenda) || 0,
        margem: parseFloat(margem) || 0,
        ativo: ativo !== false,
        nome_customizado: nomeCustomizado || null,
        descricao_customizada: descricaoCustomizada || null,
        time_nome_customizado: timeNomeCustomizado || null
      },`
);

fs.writeFileSync(path, content);
console.log('Catalog route improved with robust parsing');
