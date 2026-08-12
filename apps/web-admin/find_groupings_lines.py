import sys
import os

content = open('app/super-admin/leaderboard/[id]/page.tsx', encoding='utf-8').read()
lines = content.splitlines()

# Search backwards from 1500 to find "activeTab === "groupings"" or something similar
for i in range(1500, 1000, -1):
    if "groupings" in lines[i]:
        print(f'Line {i+1}: {lines[i]}')
