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
      
      content = content.replace(/className="border-none shadow-sm"/g, 'className="border border-[#e7e7e7] shadow-sm"');
      content = content.replace(/className="border-none shadow-sm lg:col-span-1"/g, 'className="border border-[#e7e7e7] shadow-sm lg:col-span-1"');
      content = content.replace(/className="border-none shadow-sm lg:col-span-2"/g, 'className="border border-[#e7e7e7] shadow-sm lg:col-span-2"');
      content = content.replace(/className="border-none shadow-sm overflow-hidden"/g, 'className="border border-[#e7e7e7] shadow-sm overflow-hidden"');
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated Card: ${fullPath}`);
      }
    }
  }
}

targetDirs.forEach(processDirectory);
console.log('Done replacing Card borders.');
