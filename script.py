import re

super_path = r'c:\Users\samue\Desktop\Openclubos\apps\web-admin\app\super-admin\tournaments\[id]\page.tsx'
org_path = r'c:\Users\samue\Desktop\Openclubos\apps\web-admin\app\organizer-admin\tournaments\[id]\page.tsx'

with open(super_path, 'r', encoding='utf-8') as f:
    super_c = f.read()

with open(org_path, 'r', encoding='utf-8') as f:
    org_c = f.read()

print('Super groupings:', super_c.find('{activeTab === "groupings" && ('))
print('Super penalize:', super_c.find('{activeTab === "penalize" && ('))

print('Org groupings:', org_c.find('{activeTab === "groupings" && ('))
print('Org penalize:', org_c.find('{activeTab === "penalize" && ('))

if super_c.find('{activeTab === "groupings" && (') != -1 and super_c.find('{activeTab === "penalize" && (') != -1:
    groupings_block = super_c[super_c.find('{activeTab === "groupings" && ('):super_c.find('{activeTab === "penalize" && (')]
    org_start = org_c.find('{activeTab === "groupings" && (')
    org_end = org_c.find('{activeTab === "penalize" && (')
    
    new_org = org_c[:org_start] + groupings_block + org_c[org_end:]
    
    with open(org_path, 'w', encoding='utf-8') as f:
        f.write(new_org)
    print('Updated organizer-admin file successfully!')
