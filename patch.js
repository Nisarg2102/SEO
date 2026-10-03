const fs = require('fs');
const file = 'apps/web/src/components/layout/Shell.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /onClick=\{\(\) => setOpen\(\(o\) => !o\)\}/g,
  `onClick={() => {
          if (open) {
            setCreating(false);
            setCreateModalOpen(false);
            setOpen(false);
          } else {
            setOpen(true);
          }
        }}`
);

code = code.replace(
  /onClick=\{\(\) => \{ setActiveWorkspace\(ws\); setOpen\(false\); \}\}/g,
  `onClick={() => { 
                  setActiveWorkspace(ws); 
                  setOpen(false); 
                  setCreating(false);
                  setCreateModalOpen(false);
                }}`
);

fs.writeFileSync(file, code);
