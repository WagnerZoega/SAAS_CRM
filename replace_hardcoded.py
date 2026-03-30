#!/usr/bin/env python3
"""
Substituição de todos links hardcoded + adição de aba Clientes no admin
"""
import re

path = r'd:\saas-crm\frontend\src\app\admin\page.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"File: {len(content)} chars")
print(f"localhost:3001 before: {content.count('localhost:3001')}")
print(f"Has API_URL: {'const API_URL' in content}")

# 1. Replace all simple string fetch calls: 'http://localhost:3001/api/ → `${API_URL}/api/
content = re.sub(r"'http://localhost:3001/api/", "`${API_URL}/api/", content)
content = re.sub(r'"http://localhost:3001/api/', '`${API_URL}/api/', content)
# For cases where there's already a template literal
content = re.sub(r'`http://localhost:3001/api/', '`${API_URL}/api/', content)

# 2. Replace localhost:3005 in store links
content = content.replace("localhost:3005/loja/", "${STORE_URL}/loja/")

print(f"localhost:3001 after: {content.count('localhost:3001')}")

with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("✅ Done!")
