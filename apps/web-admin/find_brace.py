content = open('app/super-admin/leaderboard/[id]/page.tsx', encoding='utf-8').read()
lines = content.splitlines()

# find the character index of the '}' at line 1718
target_line = 1718 - 1
idx = 0
for i in range(target_line):
    idx += len(lines[i]) + 1
idx += lines[target_line].find('}')

brace_count = 0
for i in range(idx, -1, -1):
    if content[i] == '}':
        brace_count += 1
    elif content[i] == '{':
        brace_count -= 1
        if brace_count == 0:
            print(f'Matching {{ is at line {content[:i].count(chr(10)) + 1}')
            break
