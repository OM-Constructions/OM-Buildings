import os
import re

TARGET_DIR = "/home/godwin/om buildings"

replacements = [
    (r'&\s*Structural Engineering Consultants', r'& Engineering Consultants'),
    (r'&\s*Structural Engineering consultants', r'& Engineering consultants'),
    (r'&\s*STRUCTURAL ENGINEERING CONSULTANTS', r'& ENGINEERING CONSULTANTS'),
    (r'&amp;\s*Structural Engineering Consultants', r'&amp; Engineering Consultants'),
    (r'&amp;\s*Structural Engineering consultants', r'&amp; Engineering consultants'),
    (r'&amp;\s*STRUCTURAL ENGINEERING CONSULTANTS', r'&amp; ENGINEERING CONSULTANTS'),
]

for root, dirs, files in os.walk(TARGET_DIR):
    if '.git' in root or 'node_modules' in root or '__pycache__' in root or 'venv' in root:
        continue
    for file in files:
        if file.endswith('.html') or file.endswith('.js') or file.endswith('.py') or file.endswith('.css'):
            path = os.path.join(root, file)
            if 'fix_branding.py' in path: continue
            
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            orig_content = content
            for pat, repl in replacements:
                content = re.sub(pat, repl, content)
            
            if content != orig_content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated: {path}")
