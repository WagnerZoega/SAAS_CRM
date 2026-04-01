import os
import re

def final_polish(path):
    if not os.path.exists(path): return
    with open(path, 'rb') as f:
        data = f.read()

    # UTF-8 Cleanup (Nuclear)
    # This dictionary maps specific byte-level corruptions found in the screenshot/report
    label_fixes = [
        (b'OPERA\xc3\x83\xc2\x87\xc3\x83\xcb\x9cO', b'OPERA\xc3\x87\xc3\x83O'), 
        (b'OPERA\xc3\x83\xe2\x80\xa0\xc3\xa7\xc3\x83\xcb\x9cO', b'OPERA\xc3\x87\xc3\x83O'),
        (b'OPERA\xc3\x83\xc2\x83O', b'OPERA\xc3\x87\xc3\x83O'),
        (b'\xc3\x82\xc2\xa0', b' '), # Non-breaking space
        (b'\xc3\x83\xc2\x9altimos', b'\xc3\x9altimos'),
        (b'\xc3\x83\xc2\xadvel', b'N\xc3\xadvel'),
        (b'M\xc3\x83\xc2\xaa', b'M\xc3\xaa'),
        (b'M\xc3\x83\xc2\xa1xima', b'M\xc3\xa1xima'),
        (b'f\xc3\xa3s', b'f\xc3\xa3s'),
        (b'F\xc3\x83\xc2\xa3s', b'F\xc3\xa3s'),
        (b'cat\xc3\x83\xc2\xa1logo', b'cat\xc3\xa1logo'),
        (b'Cat\xc3\x83\xc2\xa1logo', b'Cat\xc3\xa1logo'),
        (b'Configura\xc3\x83\xc2\xa7\xc3\x83\xc2\xb5es', b'Configura\xc3\xa7\xc3\xb5es'),
        (b'CONFIGURA\xc3\x83\xc2\x87\xc3\x83\xc2\x95ES', b'CONFIGURA\xc3\x87\xc3\x95ES'),
        (b'Selo\xc3\x83\xc2\xa7\xc3\x83\xc2\xb5es', b'Sele\xc3\xa7\xc3\xb5es'),
        (b'Brasileiro \xc3\xb0\xc5\xb8\xe2\x80\x98\xc2\xa7', b'Brasileiro \xf0\x9f\x87\xa7\xf0\x9f\x87\xb7'),
        (b'Europeus \xc3\xb0\xc5\xb8\xe2\x80\x98\xc2\xaa', b'Europeus \xf0\x9f\x87\xaa\xf0\x9f\x87\xba'),
        (b'Premier League \xc3\xb0\xc5\xb8\xc2\xb4\xc3\xb3\xc2\xa0\xc2\xa7', b'Premier League \xf0\x9f\x8f\xb4\xf0\x9f\x8f\xb4\xe2\x80\x8d\xe2\x98\xa0\xef\xb8\x8f'), # Flag fix
        (b'Sele\xc3\x83\xc2\xa7\xc3\x83\xc2\xb5es \xc3\xb0\xc5\xb8\xc2\x8c\xc2\x8e', b'Sele\xc3\xa7\xc3\xb5es \xf0\x9f\x8c\x8e'),
        (b'Ver Todos \xc3\xb0\xc5\xb8\xe2\x80\x9d\xc2\xa6', b'Ver Todos \xf0\x9f\x93\xa6'),
        (b'\xc3\xa2\xe2\x82\xac\xe2\x80\x9c', b'-'), # Dash
        (b'\xc3\x83\xc2\x9a', b'\xc3\x9a'), # Ú
        (b'\xc3\x83\xc2\xa9', b'\xc3\xa9'), # é
        (b'\xc3\x83\xc2\xa1', b'\xc3\xa1'), # á
        (b'\xc3\x83\xc2\xa3', b'\xc3\xa3'), # ã
        (b'\xc3\x83\xc2\xa7', b'\xc3\xa7'), # ç
        (b'\xc3\x83\xc2\xb5', b'\xc3\xb5'), # õ
        (b'\xc3\x83\xc2\xb3', b'\xc3\xb3'), # ó
        (b'\xc3\x83\xc2\x81', b'\xc3\x81'), # Á
        (b'\xc3\x83\xc2\x8d', b'\xc3\x8d'), # Í
    ]
    
    for old, new in label_fixes:
        data = data.replace(old, new)

    # REINFORCE IMAGE GUARDS FOR ALL
    # Look for any <Image src={X} and wrap if not guarded
    # This time use a more generic regex on strings
    def regex_guard(match):
        full = match.group(0)
        var = match.group(1)
        # If it's already inside a curly brace with a ternary, skip
        if b'?' in full or b'&&' in full:
            return full
        return b'{(' + var + b') ? ' + full + b' : <div className="bg-slate-800/20 w-full h-full flex items-center justify-center"><ImageIcon size={16} className="text-white/10" /></div>}'

    # Target: <Image src={...} ... />
    data = re.sub(b'<Image\s+src={([^}]+)}([^>]+)/>', regex_guard, data)

    with open(path, 'wb') as f:
        f.write(data)
    print(f"Final Polish applied to: {path}")

if __name__ == "__main__":
    fix_file = r'd:\saas-crm\frontend\src\app\admin\page.tsx'
    final_polish(fix_file)
    final_polish(r'd:\saas-crm\frontend\src\app\master-admin\page.tsx')
    final_polish(r'd:\saas-crm\frontend\src\app\page.tsx')
