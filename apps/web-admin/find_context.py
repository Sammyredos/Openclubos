import sys

content = open('app/super-admin/leaderboard/[id]/page.tsx', encoding='utf-8').read()
idx = content.find('activeTab === "groupings"')
print(content[idx-50:idx+50])
