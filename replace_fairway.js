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
        .replace(/fairway-/g, 'openclub-')
        .replace(/fairwayos/gi, 'openclubos')
        .replace(/FairwayOS/g, 'OpenclubOS')
        .replace(/Fairway/g, 'Openclub');
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
      }
    }
  }
}

replaceInDir('apps/web-admin/components');
replaceInDir('apps/web-admin/app');
console.log('Replaced Fairway with Openclub successfully');
