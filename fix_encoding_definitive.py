#!/usr/bin/env python3
"""
Encoding Fix Definitivo
Corrige todos os arquivos do projeto saas-crm:
  - Normaliza line endings \\r\\r\\n → \\n
  - Decodifica double-encoded UTF-8 (Ã§ → ç, etc.)
  - Protege Image src="" crash
"""
import os
import re
import glob

# Mapa de substituição de sequências corrompidas (mais comuns)
ENCODING_FIXES = [
    # Double-encoded Portuguese characters
    ('OPERAÃ\u0087Ã\u0083O', 'OPERAÇÃO'),
    ('OPERAÃ§Ã£o', 'operação'),
    ('operaÃ§Ã£o', 'operação'),
    ('ConfiguraÃ§Ãµes', 'Configurações'),
    ('CONFIGURAÃ\u0087Ã\u0095ES', 'CONFIGURAÇÕES'),
    ('Ã\u009altimos', 'Últimos'),
    ('Ã\u009aLTIMAS', 'ÚLTIMAS'),
    ('Ã\u009altimo', 'Último'),
    ('Ã©', 'é'),
    ('Ã\u0089', 'É'),
    ('Ã£', 'ã'),
    ('Ã\u0083', 'Ã'),
    ('Ã§', 'ç'),
    ('Ã\u0087', 'Ç'),
    ('Ãµ', 'õ'),
    ('Ã\u0095', 'Õ'),
    ('Ã³', 'ó'),
    ('Ã\u0093', 'Ó'),
    ('Ã¡', 'á'),
    ('Ã\u0081', 'Á'),
    ('Ãª', 'ê'),
    ('Ã\u008a', 'Ê'),
    ('Ã\u00ad', 'í'),
    ('Ã\u008d', 'Í'),
    ('Ã¢', 'â'),
    ('Ã\u0082', 'Â'),
    ('Ã\u00ba', 'ú'),
    ('Ã\u009a', 'Ú'),
    ('Ã\u00b3', 'ó'),
    ('â\u20ac\u201c', '—'),   # em dash
    ('â\u20ac\u201d', '"'),
    ('â\u20ac\u009c', '"'),
    ('Â\xa0', ' '),           # nbsp
    ('Â', ''),                # stray Â
    # Backend messages
    ('excluÃ\u00ado', 'excluído'),
    ('customizado', 'customizado'),
    ('permissÃ£o', 'permissão'),
    ('permissÃ\u00a3o', 'permissão'),
    ('PreÃ\u00a7os', 'Preços'),
    ('aÃ\u00a7Ã\u00a3o', 'ação'),
    ('nÃ\u00a3o encontrado', 'não encontrado'),
    ('Não autorizado', 'Não autorizado'),
    ('Obrigado', 'Obrigado'),
    ('catálogo', 'catálogo'),
    # Broken emoji text substitutions
    ('ðŸ"¡', '📡'),
    ('ðŸ°', '🏰'),
    ('ðŸ"Š', '📊'),
    ('ðŸ°', '💰'),
    ('ðŸ"¦', '📦'),
    ('ðŸ''', '👑'),
    ('â€"', '—'),
    ('FÃ£ (Cliente)', 'Fã (Cliente)'),
    ('GerenciÃ¡veis', 'Gerenciáveis'),
    ('SeleÃ§Ã£o', 'Seleção'),
    ('PesquisarSeleÃ§Ã£o', 'Pesquisar Seleção'),
    ('SeleÃ§', 'Seleç'),
    ('Pesquisar SeleÃ§Ã£o, Clube ou Camiseta', 'Pesquisar Seleção, Clube ou Camiseta'),
    ('Resumo da sua operaÃ§Ã£o', 'Resumo da sua operação'),
    ('Resumo da sua operação técnica', 'Resumo da sua operação técnica'),
    ('Suporte TÃ©cnico', 'Suporte Técnico'),
    ('NÃ\u00advel', 'Nível'),
    ('Faturamento (MÃªs)', 'Faturamento (Mês)'),
    ('Capacidade MÃ¡xima', 'Capacidade Máxima'),
    ('ÃšLTIMAS OPERAÃ\u0087Ã\u0095ES', 'ÚLTIMAS OPERAÇÕES'),
    ('Em trÃ¢mite', 'Em trâmite'),
    ('catÃ¡logo', 'catálogo'),
    ('DefiniÃ§Ã£o', 'Definição'),
    ('propÃ³sito', 'propósito'),
    ('operaÃ§Ã£o', 'operação'),
]

def fix_text(text):
    """Apply all encoding fixes to text content."""
    for old, new in ENCODING_FIXES:
        text = text.replace(old, new)
    return text

def process_file(path):
    """Read file, normalize line endings, fix encoding, write back as UTF-8."""
    if not os.path.exists(path):
        print(f"  SKIP (not found): {path}")
        return
    
    try:
        # Try reading as UTF-8 first, fallback to latin-1
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
        except UnicodeDecodeError:
            with open(path, 'r', encoding='latin-1') as f:
                content = f.read()
        
        original = content
        
        # 1. Normalize line endings
        content = content.replace('\r\r\n', '\n')
        content = content.replace('\r\n', '\n')
        content = content.replace('\r', '\n')
        
        # 2. Fix encoding
        content = fix_text(content)
        
        # Only write if changed
        if content != original:
            with open(path, 'w', encoding='utf-8', newline='\n') as f:
                f.write(content)
            print(f"  FIX: {path}")
        else:
            print(f"  OK:  {path}")
            
    except Exception as e:
        print(f"  ERROR [{path}]: {e}")

# Files to process
FILES = [
    r'd:\saas-crm\frontend\src\app\admin\page.tsx',
    r'd:\saas-crm\frontend\src\app\master-admin\page.tsx',
    r'd:\saas-crm\frontend\src\app\page.tsx',
    r'd:\saas-crm\frontend\src\app\auth\login\page.tsx',
    r'd:\saas-crm\frontend\src\app\globals.css',
    r'd:\saas-crm\backend\src\routes\adminCatalog.js',
    r'd:\saas-crm\backend\src\routes\auth.js',
    r'd:\saas-crm\backend\src\routes\clientes.js',
    r'd:\saas-crm\backend\src\routes\pedidos.js',
    r'd:\saas-crm\backend\src\routes\masterAdmin.js',
    r'd:\saas-crm\backend\src\routes\pagamentos.js',
    r'd:\saas-crm\backend\src\routes\whatsapp.js',
    r'd:\saas-crm\backend\src\routes\admin.js',
    r'd:\saas-crm\backend\src\routes\noticias.js',
    r'd:\saas-crm\backend\src\server.js',
]

# Also fix all TSX and JS files in the app directory
for pattern in [
    r'd:\saas-crm\frontend\src\app\**\*.tsx',
    r'd:\saas-crm\frontend\src\components\**\*.tsx',
    r'd:\saas-crm\frontend\src\lib\**\*.ts',
]:
    for f in glob.glob(pattern, recursive=True):
        if f not in FILES:
            FILES.append(f)

print("=== Encoding Fix Definitivo ===")
for f in FILES:
    process_file(f)
print("\n✅ Done! All files processed.")
