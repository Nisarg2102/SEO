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
                # find apiClient.get(`...`) or apiClient.get('...')
                calls = re.findall(r"apiClient\.(get|post|put|patch|delete)\([`'\"]([^`'\"]+)[`'\"]", content)
                for method, endpoint in calls:
                    # replace ${workspaceId} with :workspaceId
                    cleaned = re.sub(r'\$\{workspaceId\}', ':workspaceId', endpoint)
                    cleaned = re.sub(r'\$\{[^}]+\}', ':id', cleaned)
                    frontend_apis.append(f"{method.upper()} {cleaned}")

print("Frontend Calls:")
for call in sorted(set(frontend_apis)):
    print(f"  {call}")

