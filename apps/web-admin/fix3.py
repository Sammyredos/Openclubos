import re

code = '''
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Men': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Women': return 'bg-pink-100 text-pink-800 border-pink-200';
    case 'Seniors': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Juniors': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};
'''

for filepath in ['app/super-admin/leaderboard/[id]/page.tsx', 'app/organizer-admin/leaderboard/[id]/page.tsx']:
    content = open(filepath, 'r', encoding='utf-8').read()
    if 'getCategoryColor = ' not in content:
        content = content.replace('export default function ViewTournamentPage', code + '\nexport default function ViewTournamentPage')
        open(filepath, 'w', encoding='utf-8').write(content)
