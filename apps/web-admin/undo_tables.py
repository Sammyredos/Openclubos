import sys
import re
import glob

def undo_file(filepath):
    print(f"Undoing {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if '{/* Main Container */}' not in content:
        print(f"Skipping {filepath}: Main Container not found")
        return False
        
    # Undo the top wrapper
    top_pattern = r'\{\/\* Main Container \*\/\}\s*<div className="px-6 pb-6">\s*<div className="bg-background rounded-xl border border-\[#e1efe5\] overflow-hidden">\s*<div className="p-5 border-b border-\[#e1efe5\]">\s*<div className="([^\"]*)">'
    
    def replace_top(m):
        inner_classes = m.group(1).strip()
        if inner_classes == 'flex flex-col md:flex-row md:items-center justify-between gap-4':
            return '<div className="px-6 pb-6">\n              <div className="bg-background rounded-xl border border-[#e1efe5] p-5">\n                <div className="' + inner_classes + '">'
        return f'<div className="px-6 pb-6 {inner_classes}">'
        
    content = re.sub(top_pattern, replace_top, content, count=1)
    
    # Undo the extra closing tag before table IF it was added
    # We added `</div>\n          ` before `{/* Table */}`
    table_pattern = r'</div>\n          (\{\/\*\s*Table\s*\*\/\}\s*<div className="w-full overflow-x-auto min-h-\[400px\]">)'
    content = re.sub(table_pattern, r'\1', content, count=1)
    
    # Undo the extra closing tags before </CardContent>
    # We added `\n          </div>\n        </div>` before `</CardContent>`
    end_pattern = r'\n          </div>\n        </div>(\s*</CardContent>)'
    content = re.sub(end_pattern, r'\1', content, count=1)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Successfully reverted {filepath}")
    return True

if __name__ == "__main__":
    files = glob.glob('app/**/*.tsx', recursive=True)
    for f in files:
        if 'page.tsx' in f and 'tournaments' not in f:
            undo_file(f)
