import os

files = [
    'app/super-admin/leaderboard/[id]/page.tsx',
    'app/organizer-admin/leaderboard/[id]/page.tsx',
    'app/super-admin/tournaments/[id]/page.tsx',
    'app/organizer-admin/tournaments/[id]/page.tsx'
]

for filepath in files:
    if os.path.exists(filepath):
        content = open(filepath, 'r', encoding='utf-8').read()
        
        content = content.replace('</>\n                    )}\n', '</div>\n                    )\n')
        
        open(filepath, 'w', encoding='utf-8').write(content)
