const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content
        .replace(/#10b981/g, '#15803D')
        .replace(/#0da673/g, '#166534')
        .replace(/emerald-500/g, 'fairway-700')
        .replace(/emerald-600/g, 'fairway-800');
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
      }
    }
  }
}

replaceInDir('apps/web-admin/components');
replaceInDir('apps/web-admin/app');
console.log('Colors replaced successfully');
