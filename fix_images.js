const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else if (name.endsWith('.tsx') || name.endsWith('.ts')) {
      files.push(name);
    }
  }
  return files;
}

const files = getFiles('apps/web-admin');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace rounded-xl, rounded-lg, rounded-md with rounded-full in img tags
  // We'll use a regex that finds <img ... className=" ... " ... />
  const newContent = content.replace(/<img[^>]+className=["'][^"']*["'][^>]*>/g, (match) => {
    if (match.includes('rounded-xl') || match.includes('rounded-lg') || match.includes('rounded-md') || match.includes('rounded-2xl')) {
        return match.replace(/rounded-(?:xl|lg|md|sm|2xl|3xl)/g, 'rounded-full');
    }
    return match;
  });

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Updated images in ' + file);
  }
}
