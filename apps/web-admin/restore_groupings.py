import sys

files = [
    r'app/organizer-admin/tournaments/[id]/page.tsx',
    r'app/super-admin/leaderboard/[id]/page.tsx',
    r'app/organizer-admin/leaderboard/[id]/page.tsx'
]

with open('groupings_block.tsx', encoding='utf-8') as f:
    replacement = f.read()

c = 0
for file_path in files:
    try:
        with open(file_path, encoding='utf-8') as f:
            content = f.read()
            
        start_str = '{activeTab === "groupings" && ('
        start_idx = content.find(start_str)
        if start_idx == -1:
            print(f"Start not found in {file_path}")
            continue
            
        brace_count = 0
        end_idx = -1
        for i in range(start_idx, len(content)):
            if content[i] == '{':
                brace_count += 1
            elif content[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i + 1
                    break
                    
        if end_idx != -1:
            new_content = content[:start_idx] + replacement + content[end_idx:]
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            c += 1
            print(f"Restored {file_path}")
    except Exception as e:
        print(f"Error on {file_path}: {e}")

print(f"Updated {c} files")
