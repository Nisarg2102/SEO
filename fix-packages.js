const fs = require('fs');

function addDep(path) {
  const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
  if (!pkg.dependencies) pkg.dependencies = {};
  pkg.dependencies['@ai-marketing/shared'] = '*';
  
  if (path.includes('apps/api/package.json')) {
    pkg.scripts['build:deps'] = pkg.scripts['build:deps'].replace(
      '--workspace=@ai-marketing/ai',
      '--workspace=@ai-marketing/shared --workspace=@ai-marketing/ai'
    );
  }
  
  fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
  console.log('Fixed', path);
}

addDep('apps/api/package.json');
addDep('services/seo/package.json');

// Check web's build deps just in case
const webPkg = JSON.parse(fs.readFileSync('apps/web/package.json', 'utf8'));
if (webPkg.scripts['build:deps']) {
  if (!webPkg.scripts['build:deps'].includes('@ai-marketing/shared')) {
    webPkg.scripts['build:deps'] = webPkg.scripts['build:deps'].replace(
      '--workspace=@ai-marketing/ai',
      '--workspace=@ai-marketing/shared --workspace=@ai-marketing/ai'
    );
    fs.writeFileSync('apps/web/package.json', JSON.stringify(webPkg, null, 2) + '\n');
    console.log('Fixed apps/web/package.json');
  }
}
