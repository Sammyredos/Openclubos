import sys

content = open('app/super-admin/tournaments/[id]/page.tsx', encoding='utf-8').read()
start_str = '{activeTab === "groupings" && ('
start_idx = content.find(start_str)
if start_idx == -1:
    print('Not found')
    sys.exit(1)

# Find the matching brace
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
    block = content[start_idx:end_idx]
    with open('groupings_block.tsx', 'w', encoding='utf-8') as f:
        f.write(block)
    print(f'Extracted {len(block)} chars to groupings_block.tsx')
else:
    print('No matching brace found')
