import os
import re

TARGET_DIR = "/home/godwin/om buildings"

replacements = [
    (r'OM Constructions\s+&\s+Structural Engineering [Cc]onsultants', r'OM Constructions'),
    (r'OM Constructions\s+&amp;\s+Structural Engineering [Cc]onsultants', r'OM Constructions'),
    (r'Constructions\s+&\s+Structural Engineering consultants', r'OM Constructions'),
    (r'\s*&\s*Structural Engineering Consultants', r''),
    (r'\s*&\s*Structural Engineering consultants', r''),
    (r'\s*&\s*STRUCTURAL ENGINEERING CONSULTANTS', r''),
    (r'\s*&amp;\s*Structural Engineering consultants', r''),
]

for root, dirs, files in os.walk(TARGET_DIR):
    if '.git' in root or 'node_modules' in root or '__pycache__' in root:
        continue
    for file in files:
        if file.endswith('.html') or file.endswith('.js') or file.endswith('.py'):
            path = os.path.join(root, file)
            if 'scratch_replace.py' in path: continue
            
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            orig_content = content
            for pat, repl in replacements:
                content = re.sub(pat, repl, content)
            
            if content != orig_content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated: {path}")

