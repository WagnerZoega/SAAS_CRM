import os

def normalize_and_fix(path):
    if not os.path.exists(path): return
    with open(path, 'rb') as f:
        data = f.read()
    
    # 1. Normalize line endings
    data = data.replace(b'\r\r\n', b'\n')
    data = data.replace(b'\r\n', b'\n')
    data = data.replace(b'\r', b'\n')
    
    # 2. Decode and fix known corrupted sequences (more robust)
    try:
        text = data.decode('utf-8', errors='ignore')
    except:
        text = data.decode('iso-8859-1', errors='ignore')
        
    fixes = {
        'OPERAÃ§Ã£o': 'Operação',
        'OPERAÃ‡ÃƒO': 'OPERAÇÃO',
        'OPERAÃ†Ã§ÃƒO': 'OPERAÇÃO',
        'Ãšltimos': 'Últimos',
        'ÃšLTIMAS': 'ÚLTIMAS',
        'Ã‰': 'É',
        'Ã§': 'ç',
        'Ã£': 'ã',
        'Ãª': 'ê',
        'Ã¡': 'á',
        'Ã³': 'ó',
        'Ãµ': 'õ',
        'Ã­': 'í',
        'Ã¢': 'â',
        'Â': '', 
        'â€“': '—',
        'ðŸ °': '👑',
        'ðŸ“¡': '📊',
        'ðŸ“Š': '📊',
        'ðŸ‘‘': '⚽',
        'ðŸ—°': '📊',
        'ðŸ’°': '💰',
        'ðŸŒŽ': '🌍',
        'â­ ': '⭐'
    }
    
    for old, new in fixes.items():
        text = text.replace(old, new)
        
    # 3. Ensure Image guards are correct
    # We find all <Image src={VAR} and wrap them simply if they are not already guarded
    import re
    def wrap_img(m):
        full_tag = m.group(0)
        var_name = m.group(1).strip()
        if '?' in full_tag or '&&' in full_tag: return full_tag
        return f'{{({var_name}) ? {full_tag} : <div className="w-full h-full bg-slate-800/10 flex items-center justify-center"><ImageIcon size={16} className="text-white/10" /></div>}}'
    
    text = re.sub(r'<Image\s+src=\{([^}]+)\}([^>]+)/>', wrap_img, text)

    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    print(f"Normalized and Fixed: {path}")

if __name__ == "__main__":
    normalize_and_fix(r'd:\saas-crm\frontend\src\app\admin\page.tsx')
    normalize_and_fix(r'd:\saas-crm\frontend\src\app\master-admin\page.tsx')
    normalize_and_fix(r'd:\saas-crm\backend\src\routes\adminCatalog.js')
