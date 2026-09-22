import os, json, re

result = {
    "files": [],
    "css_vars": [],
    "apis": []
}

for root, dirs, files in os.walk('frontend'):
    for f in files:
        path = os.path.join(root, f)
        size = os.path.getsize(path)
        result["files"].append({"path": path, "size": size})

with open('frontend/style.css', 'r') as f:
    css = f.read()
    vars = re.findall(r'(--[a-zA-Z0-9-]+:\s*[^;]+);', css)
    result["css_vars"] = list(set(vars))

if os.path.exists('backend/app/main.py'):
    with open('backend/app/main.py', 'r') as f:
        content = f.read()
        endpoints = re.findall(r'@app\.(get|post|put|delete)\("([^"]+)"', content)
        result["apis"] = endpoints

print(json.dumps(result, indent=2)[:2000])
