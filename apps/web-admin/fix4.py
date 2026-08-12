import re

filepath = 'app/organizer-admin/reports/page.tsx'
content = open(filepath, 'r', encoding='utf-8').read()

content = content.replace('getReports(user.clubId),', 'getReports(user.clubId!),')
content = content.replace('(rpt.sizeBytes / 1024)', '((rpt.sizeBytes || 0) / 1024)')
content = content.replace('formatDate(rpt.generatedAt)', 'formatDate(rpt.createdAt)')

open(filepath, 'w', encoding='utf-8').write(content)
