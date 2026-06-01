const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, 'apps/web-admin/app/super-admin'),
  path.join(__dirname, 'apps/web-admin/app/organizer-admin')
];

function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name === 'page.tsx') {
      let content = fs.readFileSync(fullPath, 'utf8');
      const originalContent = content;
      
      content = content.replace(/border-gray-150/g, 'border-[#e7e7e7]');
      content = content.replace(/border-gray-100/g, 'border-[#e7e7e7]');
      content = content.replace(/rounded-2xl/g, 'rounded-xl');
      content = content.replace(/rounded-3xl/g, 'rounded-xl');
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

targetDirs.forEach(processDirectory);
console.log('Done replacing borders and radiuses.');
