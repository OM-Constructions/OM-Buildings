import os
import re

js_file = "/home/godwin/om buildings/frontend/src/interiorDesigns.js"
with open(js_file, 'r') as f:
    content = f.read()

images = re.findall(r"src:\s*'([^']+)'", content)
missing = []
for img in images:
    if not os.path.exists(os.path.join("/home/godwin/om buildings/frontend/assets/designs", img)):
        missing.append(img)

if not missing:
    print("All 17 interior design images are present and accounted for.")
else:
    print("MISSING IMAGES:", missing)
