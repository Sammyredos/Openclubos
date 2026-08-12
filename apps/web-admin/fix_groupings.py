import sys

files_to_fix = [
    'app/super-admin/leaderboard/[id]/page.tsx',
    'app/organizer-admin/leaderboard/[id]/page.tsx',
    'app/organizer-admin/tournaments/[id]/page.tsx'
]

replacement = open('groupings_block.tsx', encoding='utf-8').read()
if not replacement.endswith('\n'):
    replacement += '\n'

end_marker = '                  </>\n                )}\n              </div>\n            )}\n'

for file_path in files_to_fix:
    content = open(file_path, encoding='utf-8').read()
    start_idx = content.find('{activeTab === "groupings" && (')
    if start_idx == -1:
        print(f'Start not found in {file_path}')
        continue

    end_idx = content.find(end_marker, start_idx)
    if end_idx == -1:
        print(f'End not found in {file_path}')
        continue

    end_idx += len(end_marker)
    
    new_content = content[:start_idx] + replacement + content[end_idx:]
    open(file_path, 'w', encoding='utf-8').write(new_content)
    print(f'Successfully replaced the groupings block in {file_path}!')
