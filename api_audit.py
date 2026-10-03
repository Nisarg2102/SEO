import os
import re

print("=== API ENDPOINT AUDIT ===")

frontend_apis = []
for root, _, files in os.walk('apps/web/src/services'):
    for file in files:
        if file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
                calls = re.findall(r"apiClient\.(get|post|put|patch|delete)\(['\"]([^'\"]+)['\"]", content)
                for method, endpoint in calls:
                    frontend_apis.append(f"{method.upper()} {endpoint}")

backend_apis = []
for root, _, files in os.walk('apps/api/src'):
    for file in files:
        if file.endswith('.controller.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
                controller = re.search(r"@Controller\(['\"]([^'\"]+)['\"]\)", content)
                base = controller.group(1) if controller else ""
                
                methods = re.findall(r"@(?:Get|Post|Put|Patch|Delete)\(['\"]([^'\"]*)['\"]", content)
                bare_methods = re.findall(r"@(Get|Post|Put|Patch|Delete)\(\)", content)
                
                for route in methods:
                    if route:
                        backend_apis.append(f"/{base}/{route}".replace('//', '/'))
                    else:
                        backend_apis.append(f"/{base}")
                        
                for m in bare_methods:
                    backend_apis.append(f"/{base}")

print("Frontend Calls:")
for call in sorted(set(frontend_apis)):
    print(f"  {call}")
    
print("\nBackend Endpoints:")
for ep in sorted(set(backend_apis)):
    print(f"  {ep}")

