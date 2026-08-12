import sys
import re
import os

def process_file(filepath):
    print(f"Processing {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'bg-background rounded-xl border border-[#e1efe5] p-5' not in content:
        print(f"Skipping {filepath}: target container not found")
        return False
        
    # Replace top container
    new_top = '''            {/* Main Container */}
            <div className="px-6 pb-6">
              <div className="bg-background rounded-xl border border-[#e1efe5] overflow-hidden">
                <div className="p-5 border-b border-[#e1efe5]">'''
                
    old_top_pattern = r'\{\/\*\s*Filters\s*\*\/\}\s*<div className="px-6 pb-6">\s*<div className="bg-background rounded-xl border border-\[#e1efe5\] p-5">'
    
    if not re.search(old_top_pattern, content):
        print(f"Skipping {filepath}: top pattern not matched")
        return False
        
    content = re.sub(old_top_pattern, new_top, content, count=1)
    
    # Let's find the table start
    table_pattern = r'(\s*</div>\s*</div>\s*)</div>(\s*</div>)?(\s*\{\/\*\s*Table\s*\*\/\}\s*)<div className="w-full overflow-x-auto[^"]*"( px-6)?>'
    
    match = re.search(table_pattern, content)
    if not match:
        print(f"Skipping {filepath}: table pattern not matched")
        return False
        
    # We replace the matched block by removing one </div> before {/* Table */}
    # and removing ` px-6` if it exists.
    original_closing = match.group(0)
    
    # We want to keep all groups EXCEPT one `</div>`
    # Let's just remove the first `</div>` we find in the match string
    modified_closing = original_closing.replace('</div>', '', 1)
    
    # And replace the table wrapper
    modified_closing = re.sub(r'<div className="w-full overflow-x-auto[^"]*"( px-6)?>', '<div className="w-full overflow-x-auto min-h-[400px]">', modified_closing)
    
    content = content.replace(original_closing, modified_closing)
    
    # Now append two </div> tags at the end of the pagination block.
    # Pagination block ends before </CardContent>
    pagination_end_pattern = r'(<Pagination[^>]*/>\s*</div>)'
    match = re.search(pagination_end_pattern, content)
    if not match:
        print(f"Skipping {filepath}: pagination pattern not matched")
        return False
        
    content = re.sub(pagination_end_pattern, r'\1\n          </div>\n        </div>', content, count=1)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Successfully updated {filepath}")
    return True

if __name__ == "__main__":
    process_file(sys.argv[1])
