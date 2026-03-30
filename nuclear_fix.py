import os
import re

def fix_file(path):
    if not os.path.exists(path): return
    with open(path, 'rb') as f:
        content = f.read()
    
    # 1. FIX DOUBLE/TRIPLE ENCODING (The "Nuclear" approach)
    # We replace common corrupted sequences with their correct UTF-8 bytes
    replacements = [
        # OPERAÇÃO, OPERAÇÕES
        (b'\xc3\x83\xc2\x87\xc3\x83\xc2\x95ES', b'\xc3\x87\xc3\x95ES'), # ÇÕES
        (b'\xc3\x83\xc2\x87\xc3\x83\xc2\x83O', b'\xc3\x87\xc3\x83O'), # ÇÃO
        (b'OPERA\xc3\x83\xe2\x80\xa0\xc3\xa7\xc3\x83\xcb\x9cO', b'OPERA\xc3\x87\xc3\x83O'), # OPERAÇÃO (based on browser subagent report)
        
        # Ãšltimos -> Últimos
        (b'\xc3\x83\xc2\x9altimos', b'\xc3\x9altimos'),
        (b'\xc3\x83\xc2\x9a', b'\xc3\x9a'), # Ú
        
        # Ã‰ -> É
        (b'\xc3\x83\xc2\x89', b'\xc3\x89'),

        # Ã£ -> ã
        (b'\xc3\x83\xc2\xa3', b'\xc3\xa3'),
        
        # Ã§ -> ç
        (b'\xc3\x83\xc2\xa7', b'\xc3\xa7'),
        
        # MÃªs -> Mês
        (b'M\xc3\x83\xc2\xaa', b'M\xc3\xaa'),
        
        # Pr\xc3\xb3ximo -> Próximo
        (b'Pr\xc3\x83\xc2\xb3', b'Pr\xc3\xb3'),
        
        # Tr\xc3\xa2mite -> Trâmite
        (b'tr\xc3\x83\xc2\xa2', b'tr\xc3\xa2'),
        
        # F\xc3\xa3s -> Fãs
        (b'F\xc3\x83\xc2\xa3', b'F\xc3\xa3'),

        # M\xc3\x¡xima -> Máxima
        (b'M\xc3\x83\xc2\xa1', b'M\xc3\xa1'),
        
        # Cat\xc3\xa1logo -> Catálogo
        (b'Cat\xc3\x83\xc2\xa1', b'Cat\xc3\xa1'),
        
        # Dashboards, etc
        (b'CONFIGURA\xc3\x83\xe2\x80\xa1\xc3\x83\xe2\x80\x9dES', b'CONFIGURA\xc3\x87\xc3\x95ES'),
        
        # â€“ -> -
        (b'\xe2\x80\x93', b'-'),
        (b'\xc3\xa2\xe2\x82\xac\xe2\x80\x9c', b'-'),

        # Emojis broken (Generic fix for the common king crown and dash indicators)
        (b'\xc3\xb0\xc5\xb8\xe2\x80\x98\xc2\xa0', b'\xe2\x9a\xbd'), # King -> Ball
        (b'\xc3\xb0\xc5\xb8\xe2\x80\x9d\xc2\x8a', b'\xf0\x9f\x93\x8a'), # Chart
        (b'\xc3\xb0\xc5\xb8\xe2\x80\x9d\xc2\xa2', b'\xf0\x9f\x93\xa6'), # Box
    ]

    for old, new in replacements:
        content = content.replace(old, new)

    # 2. FIX SPECIFIC TEXT ERRORS FROM SCREENSHOT
    content = content.replace(b'OPERA\xc3\x83\xc2\x83O', b'OPERA\xc3\x87\xc3\x83O')
    content = content.replace(b'OPERA\xc3\x83\xc2\x83\xc3\x83\x20T\xc3\x83\xc2\x89', b'OPERA\xc3\x87\xc3\x83O T\xc3\x89')
    
    # 3. ADD ROBUST IMAGE GUARDS (Refined)
    # Target any <Image src={VAR} ... /> and wrap in {VAR ? ... : ...}
    def guard_image(match):
        img_tag = match.group(0)
        src_attr = match.group(1)
        if b' ' in src_attr: # might be config?.foo || prod.bar
            clean_src = src_attr
        else:
            clean_src = src_attr
        
        # Avoid double wrapping
        if b'?' in match.string[match.start()-10:match.start()]:
            return img_tag
            
        return b'{(' + clean_src + b') ? ' + img_tag + b' : <div className="w-full h-full bg-slate-800/10 flex items-center justify-center"><ImageIcon size={16} className="text-slate-700/20" /></div>}'

    # Regex to find <Image ... src={...} ... />
    # Simplified version that handles the most common ones we found
    content = re.sub(b'(<Image[^>]+src={([^}]+)}[^>]*/>)', guard_image, content)

    with open(path, 'wb') as f:
        f.write(content)
    print(f"Nuclear Fix applied to: {path}")

if __name__ == "__main__":
    fix_file(r'd:\saas-crm\frontend\src\app\admin\page.tsx')
    fix_file(r'd:\saas-crm\frontend\src\app\master-admin\page.tsx')
    fix_file(r'd:\saas-crm\frontend\src\app\page.tsx')
