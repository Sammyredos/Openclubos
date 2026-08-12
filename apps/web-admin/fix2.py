import re

for filepath in ['app/super-admin/leaderboard/[id]/page.tsx', 'app/organizer-admin/leaderboard/[id]/page.tsx']:
    content = open(filepath, 'r', encoding='utf-8').read()
    content = re.sub(r'(import \{[^}]*)(Trophy)([^}]*\} from [\'"]lucide-react[\'"])', r'\1\2, Medal\3', content)
    open(filepath, 'w', encoding='utf-8').write(content)
