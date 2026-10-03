import os
import re

dirs = ['apps/web/src/app/(dashboard)', 'apps/web/src/app/(auth)', 'apps/web/src/components']

print("=== BUTTON/ACTION AUDIT ===")

for d in dirs:
    for root, _, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r') as f:
                    content = f.read()
                
                # Check for buttons, Links, forms
                buttons = re.findall(r'<[Bb]utton[^>]*>', content)
                links = re.findall(r'<Link[^>]*>', content)
                forms = re.findall(r'<form[^>]*>', content)
                
                if buttons or links or forms:
                    print(f"\nFile: {filepath}")
                    
                    for b in buttons:
                        if 'onClick' in b:
                            click_handler = re.search(r'onClick=\{([^}]+)\}', b)
                            print(f"  - Button with onClick: {click_handler.group(1) if click_handler else 'unknown'}")
                        elif 'type="submit"' in b:
                            print("  - Submit Button")
                        else:
                            print(f"  - DEAD BUTTON (No onClick or submit): {b}")
                            
                    for l in links:
                        href = re.search(r'href="([^"]+)"', l)
                        if href:
                            print(f"  - Link to: {href.group(1)}")
                        else:
                            print(f"  - Link without literal string href: {l}")
                            
                    for form in forms:
                        submit = re.search(r'onSubmit=\{([^}]+)\}', form)
                        print(f"  - Form onSubmit: {submit.group(1) if submit else 'NONE'}")
