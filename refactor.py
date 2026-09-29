import os
import re

target_dir = "apps/web/src"

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    if "http://localhost:3001" not in content and "localStorage.getItem('accessToken')" not in content:
        return

    # Add import
    if "import { apiClient }" not in content:
        # Count depth to src
        depth = filepath.count('/') - 2 # apps/web/src/app/workspaces/[id]/page.tsx -> depth 4
        # Wait, if we use absolute imports like @/lib/apiClient, we need to check tsconfig
        # Let's use relative imports by counting slashes
        parts = filepath.split('/')
        src_index = parts.index('src')
        rel_depth = len(parts) - src_index - 2
        prefix = "../" * rel_depth if rel_depth > 0 else "./"
        import_stmt = f"import {{ apiClient }} from '{prefix}lib/apiClient';\n"
        
        # Insert after the last import, or at the top
        lines = content.split('\n')
        last_import = -1
        for i, line in enumerate(lines):
            if line.startswith("import "):
                last_import = i
        
        if last_import != -1:
            lines.insert(last_import + 1, import_stmt)
        else:
            lines.insert(0, import_stmt)
        content = '\n'.join(lines)

    # Now we need to replace manual fetch calls with apiClient
    # This is tricky because the fetch syntax varies. I will do this manually for the files to ensure correctness.
    
    pass

