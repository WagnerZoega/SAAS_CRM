import os
import re

def fix_frontend(path):
    if not os.path.exists(path): return
    with open(path, 'rb') as f:
        data = f.read()
    
    # 1. ENCODING FIXES
    replacements = {
        b'CAT\xc3\x83\xc2\x81LOGO': b'CAT\xc3\x81LOGO',
        b'CAT\xc3\x83\x20LOGO': b'CAT\xc3\x81LOGO',
        b'CONFIGURA\xc3\x83\xc2\x87\xc3\x83\xc2\x95ES': b'CONFIGURA\xc3\x87\xc3\x95ES',
        b'SELE\xc3\x83\xc2\x87\xc3\x83\xc2\x95ES': b'SELE\xc3\x87\xc3\x95ES',
        b'est\xc3\x83\xc2\xa3o': b'est\xc3\xa3o',
        b'conex\xc3\x83\xc2\xa3o': b'conex\xc3\xa3o',
        b'VERS\xc3\x83\xc2\x83O': b'VERS\xc3\x83O',
        b'Vers\xc3\x83\xc2\xa3o': b'Vers\xc3\xa3o',
        b'Opera\xc3\x83\xc2\xa7\xc3\x83\xc2\xa3o': b'Opera\xc3\xa7\xc3\xa3o',
        b'Opera\xc3\x83\xc2\xa7\xc3\x83\xc2\xb5es': b'Opera\xc3\xa7\xc3\xb5es',
        b'Pe\xc3\x83\xc2\xa7a': b'Pe\xc3\xa7a',
        b'Respons\xc3\x83\xc2\xa1vel': b'Respons\xc3\xa1vel',
        b'prop\xc3\x83\xc2\xb3sito': b'prop\xc3\xb3sito',
        b'Altera\xc3\x83\xc2\xa7\xc3\x83\xc2\xb5es': b'Altera\xc3\xa7\xc3\xb5es',
        b'Imp\xc3\x83\xc2\xa9rio': b'Imp\xc3\xa9rio',
        b't\xc3\x83\xc2\xa9cnica': b't\xc3\xa9cnica',
        b'N\xc3\x83\xc2\xadvel': b'N\xc3\xadvel',
        b'tr\xc3\x83\xc2\xa2mite': b'tr\xc3\xa2mite',
        b'F\xc3\x83\xc2\xa3s': b'F\xc3\xa3s',
        b'\xc3\x83\xc2\x9altimas': b'\xc3\x9altimas',
        b'Cap\xc3\x83\xc2\xadtulo': b'Cap\xc3\xadtulo',
        b'cat\xc3\x83\xc2\xa1logo': b'cat\xc3\xa1logo'
    }
    for old, new in replacements.items():
        data = data.replace(old, new)

    # 2. IMAGE COMPONENT GUARDS
    # Replace <Image src={X} ... /> with {(X) ? <Image src={X} ... /> : <div className="w-full h-full bg-slate-800/10 flex items-center justify-center scale-90 opacity-20"><ImageIcon size={20} /></div>}
    # We target specific common patterns to avoid breaking logic
    
    # Pattern A: p.foto_principal
    p_img = b'{p.foto_principal ? <Image src={p.foto_principal} alt="" fill className="object-cover" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center"><ImageIcon size={16} className="text-white/10" /></div>}'
    data = data.replace(b'<Image src={p.foto_principal} alt="" fill className="object-cover" />', p_img)
    
    # Pattern B: config?.foto_principal_customizada || prod.foto_principal
    c_img = b'{(config?.foto_principal_customizada || prod.foto_principal) ? <Image src={config?.foto_principal_customizada || prod.foto_principal} alt="" fill className="object-cover group-hover/card:scale-110 transition-transform duration-500" /> : <div className="w-full h-full bg-white/5" />}'
    data = data.replace(b'<Image src={config?.foto_principal_customizada || prod.foto_principal} alt="" fill className="object-cover group-hover/card:scale-110 transition-transform duration-500" />', c_img)
    
    # Pattern C: editingProduct.foto_principal_customizada || editingProduct.foto_principal
    e_img = b'{(editingProduct.foto_principal_customizada || editingProduct.foto_principal) ? <Image src={editingProduct.foto_principal_customizada || editingProduct.foto_principal} alt="" fill className="object-contain p-10" /> : <div className="w-full h-full flex items-center justify-center"><Camera size={48} className="text-white/10" /></div>}'
    data = data.replace(b'<Image src={editingProduct.foto_principal_customizada || editingProduct.foto_principal} alt="" fill className="object-contain p-10" />', e_img)

    with open(path, 'wb') as f:
        f.write(data)
    print(f"Fixed Frontend: {path}")

def fix_backend(path):
    if not os.path.exists(path): return
    with open(path, 'rb') as f:
        data = f.read()
    
    replacements = {
        b'N\xc3\x83\xc2\xa3o autorizado': b'N\xc3\xa3o autorizado',
        b'inv\xc3\x83\xc2\xa1lido': b'inv\xc3\xa1lido',
        b'cria\xc3\x83\xc2\xa7\xc3\x83\xc2\xa3o': b'cria\xc3\xa7\xc3\xa3o',
        b'cat\xc3\x83\xc2\xa1logo': b'cat\xc3\xa1logo',
        b'pre\xc3\x83\xc2\xa7o': b'pre\xc3\xa7o',
        b'encontrado': b'encontrado'
    }
    for old, new in replacements.items():
        data = data.replace(old, new)
        
    with open(path, 'wb') as f:
        f.write(data)
    print(f"Fixed Backend: {path}")

if __name__ == "__main__":
    fix_frontend(r'd:\saas-crm\frontend\src\app\admin\page.tsx')
    fix_backend(r'd:\saas-crm\backend\src\routes\adminCatalog.js')
    fix_backend(r'd:\saas-crm\backend\src\routes\masterAdmin.js')
