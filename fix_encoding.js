const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) { 
            results.push(file);
        }
    });
    return results;
}

const files = walk('c:/Users/samue/Desktop/Openclubos/apps/web-admin');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    content = content.replace(/â€”/g, '—');
    content = content.replace(/â€¦/g, '…');
    content = content.replace(/âˆž/g, '∞');
    content = content.replace(/â€¢/g, '•');
    content = content.replace(/â‚¦/g, '₦');
    
    // Replace specific $ patterns to ₦ to be safe around template literals
    content = content.replace(/\$([0-9])/g, '₦$1');
    content = content.replace(/\$\$\{/g, '₦${');
    content = content.replace(/"\$"/g, '"₦"');
    content = content.replace(/'\$'/g, "'₦'");

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
