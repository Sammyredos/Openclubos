import sys

files_to_fix = [
    'app/super-admin/leaderboard/[id]/page.tsx'
]
content = open(files_to_fix[0], encoding='utf-8').read()
start_idx = content.find('activeTab === "groupings"')
print(content[start_idx-20:start_idx+100])
