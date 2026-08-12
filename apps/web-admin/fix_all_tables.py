import sys
import glob

def process_file(filepath):
    print(f"Processing {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the start of the filters
    target_start = '<div className="px-6 pb-6 flex'
    if target_start not in content:
        print(f"Skipping {filepath}: target_start not found")
        return
            
    start_idx = content.find(target_start)
    end_idx = content.find('>', start_idx) + 1
    opening_tag = content[start_idx:end_idx]
    
    classes = opening_tag.replace('<div className="px-6 pb-6 ', '')[:-2] # remove ' ">'
    if not classes:
        classes = "flex flex-col md:flex-row md:items-center justify-between gap-4"
        
    new_opening = f'''{{/* Main Container */}}
          <div className="px-6 pb-6">
            <div className="bg-background rounded-xl border border-[#e1efe5] overflow-hidden">
              <div className="p-5 border-b border-[#e1efe5]">
                <div className="{classes}">'''
                
    content = content[:start_idx] + new_opening + content[end_idx:]
    
    table_wrapper_idx = content.find('<div className="w-full overflow-x-auto', start_idx)
    if table_wrapper_idx == -1:
        table_wrapper_idx = content.find('<div className="overflow-x-auto', start_idx)
        
    if table_wrapper_idx == -1:
        print(f"Skipping {filepath}: table wrapper not found")
        return
        
    last_div_idx = content.rfind('</div>', 0, table_wrapper_idx)
    
    new_closing = '</div>\n              </div>'
    content = content[:last_div_idx] + new_closing + content[last_div_idx+6:]
    
    card_content_end = content.rfind('</CardContent>')
    if card_content_end == -1:
        print(f"Skipping {filepath}: </CardContent> not found")
        return
        
    new_card_end = '  </div>\n          </div>\n        </CardContent>'
    content = content[:card_content_end] + new_card_end + content[card_content_end+14:]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Successfully processed {filepath}")

for filepath in glob.glob('app/**/*.tsx', recursive=True):
    if 'page.tsx' in filepath and 'tournaments' not in filepath:
        process_file(filepath)
