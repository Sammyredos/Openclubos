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
      
      // Update background colors
      let newContent = content
        .replace(/bg-\[\#F9FAFB\]/g, 'bg-[#f4f5f9]')
        .replace(/bg-gray-50/g, 'bg-background')
        
      // Update border colors
        .replace(/border-\[\#e7e7e7\]/g, 'border-[#dbdcde]')
        .replace(/border-\[\#D1D5DB\]/g, 'border-[#dbdcde]')
        .replace(/border-zinc-300/g, 'border-[#dbdcde]');
        
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
      }
    }
  }
}

replaceInDir('apps/web-admin/components');
replaceInDir('apps/web-admin/app');
console.log('Colors replaced successfully');
