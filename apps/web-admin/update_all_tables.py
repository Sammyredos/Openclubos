import sys
import re
import os
import glob

def process_file(filepath):
    print(f"Processing {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern for the top filter container
    # Typically looks like:
    # <div className="px-6 pb-6 flex flex-wrap items-center gap-4">
    # or
    # <div className="px-6 pb-6 flex flex-wrap items-center justify-between gap-4">
    # We want to replace it with:
    # {/* Main Container */}
    # <div className="px-6 pb-6">
    #   <div className="bg-background rounded-xl border border-[#e1efe5] overflow-hidden">
    #     <div className="p-5 border-b border-[#e1efe5]">
    #       <div className="flex flex-wrap items-center gap-4">
    
    # Let's find the CardContent p-0 to start.
    if '<CardContent className="p-0">' not in content:
        print(f"Skipping {filepath}: CardContent p-0 not found")
        return False
        
    # We need to find the filters block which is the first `px-6 pb-6` inside `CardContent`.
    
    # 1. Replace the wrapper
    # Match: <div className="px-6 pb-6 ...">
    wrapper_pattern = r'<div className=\"px-6 pb-6([^\"]*)\">'
    
    # Wait, sometimes it's already wrapped in a container. Let's make sure it's not already wrapped.
    if 'bg-background rounded-xl border border-[#e1efe5] overflow-hidden' in content:
        print(f"Skipping {filepath}: already contains new container")
        return False
        
    def replace_wrapper(m):
        inner_classes = m.group(1).strip()
        if not inner_classes:
            inner_classes = 'flex flex-col md:flex-row md:items-center justify-between gap-4'
        return f'''{{/* Main Container */}}
          <div className="px-6 pb-6">
            <div className="bg-background rounded-xl border border-[#e1efe5] overflow-hidden">
              <div className="p-5 border-b border-[#e1efe5]">
                <div className="{inner_classes}">'''
                
    content = re.sub(wrapper_pattern, replace_wrapper, content, count=1)
    
    # 2. Add extra closing tags before the table.
    # The original structure just had ONE closing tag for the `px-6 pb-6` container?
    # No, wait! 
    # Originally:
    # <div className="px-6 pb-6 flex ...">
    #    ... inputs ...
    # </div>
    # {/* Table */}
    #
    # With the new structure, we have THREE tags:
    # <div className="px-6 pb-6">
    #   <div className="bg-background ...">
    #     <div className="p-5 ...">
    #       <div className="flex ...">
    #
    # Which means we need to add THREE closing tags before the table?
    # Wait, the table MUST BE INSIDE the `bg-background` container.
    # So we want to CLOSE `p-5` and `flex`, but KEEP `bg-background` and `px-6` OPEN!
    # Original closed:
    # </div> (closes the `px-6 flex` tag)
    # New should close:
    # </div> (closes `flex`)
    # </div> (closes `p-5`)
    # But DO NOT close `bg-background` or `px-6`.
    # So we replace the single `</div>` before the table with TWO `</div>`s!
    
    table_pattern = r'(\s*</div>\s*)(\{\/\*\s*Table\s*\*\/\}\s*<div className="w-full overflow-x-auto[^"]*"( px-6)?>)'
    
    def replace_table_start(m):
        closing = m.group(1)
        table_start = m.group(2)
        # Add one more closing tag for the new `p-5` container.
        # Wait! The original closed 1 tag. We now opened 4 tags. We want to leave 2 open. So we close 2 tags.
        # So we just add one more `</div>`.
        new_closing = closing + '</div>\n          '
        # Also remove `px-6` from table wrapper if it exists
        table_start = re.sub(r'(<div className="w-full overflow-x-auto[^"]*) px-6(">)', r'\1\2', table_start)
        # Ensure min-h-[400px] exists (optional, mostly it does)
        return new_closing + table_start
        
    content = re.sub(table_pattern, replace_table_start, content, count=1)
    
    # 3. Add closing tags for `bg-background` and `px-6` at the very end of Pagination.
    # Find Pagination block.
    # It usually ends with `</Pagination>` or similar, then `</div>`.
    # We want to add `</div></div>` right before `</CardContent>`.
    
    card_content_end_pattern = r'(\s*</CardContent>)'
    
    def replace_card_end(m):
        return '\n          </div>\n        </div>' + m.group(1)
        
    content = re.sub(card_content_end_pattern, replace_card_end, content, count=1)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Successfully updated {filepath}")
    return True

if __name__ == "__main__":
    files = glob.glob('app/**/*.tsx', recursive=True)
    for f in files:
        if 'page.tsx' in f and 'tournaments' not in f:
            process_file(f)
