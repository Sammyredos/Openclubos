const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx')) { 
            results.push(file);
        }
    });
    return results;
}

const files = walk('c:/Users/samue/Desktop/Openclubos/apps/web-admin/app');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('â‚¦') || content.includes('₦')) {
        content = content.replace(/â‚¦/g, '$').replace(/₦/g, '$');
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
