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

    // Replace $ at the start of a line (after whitespace) in JSX
    content = content.replace(/^(\s*)\$\{/gm, '$1₦{');
    // Replace >${
    content = content.replace(/>\$\{/g, '>₦{');
    // Replace > ${
    content = content.replace(/> \$\{/g, '> ₦{');
    // Replace space followed by ${ when preceded by > or newline (safe inside JSX text)
    // Actually just replace any space + ${ if it's not inside a backtick string.
    // A simple heuristic: if the line doesn't contain a backtick, we can replace space+${ with space+₦{
    
    let lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (!line.includes('`')) {
            // No backticks on this line, so ${ is definitely JSX!
            line = line.replace(/ \$\{/g, ' ₦{');
            line = line.replace(/\(\$\{/g, '(₦{');
        }
        lines[i] = line;
    }
    content = lines.join('\n');

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
