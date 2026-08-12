import sys

files_to_fix = [
    'app/super-admin/leaderboard/[id]/page.tsx',
    'app/organizer-admin/leaderboard/[id]/page.tsx',
    'app/organizer-admin/tournaments/[id]/page.tsx'
]

for file_path in files_to_fix:
    content = open(file_path, encoding='utf-8').read()
    start_idx = content.find('activeTab === "groupings"')
    print(f'{file_path}: {start_idx}')
