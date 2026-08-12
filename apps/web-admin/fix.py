import os

healthy_path = 'app/super-admin/tournaments/[id]/page.tsx'
leaderboard_broken_path = 'app/super-admin/leaderboard/[id]/page.tsx'

healthy_lines = open(healthy_path, 'r', encoding='utf-8').read().splitlines()
broken_lines = open(leaderboard_broken_path, 'r', encoding='utf-8').read().splitlines()

# Extract leaderboard code
start = -1
end = -1
for i, line in enumerate(broken_lines):
    if '{/* TABS 5: Leaderboard */}' in line:
        start = i
    if start != -1 and ('{/* TABS 6:' in line or '      {/* Helper Modals */}' in line):
        if end == -1:
            end = i

leaderboard_code = broken_lines[start:end]

# Now, we want to construct super-admin/leaderboard/[id]/page.tsx!
# We'll take healthy_lines, and modify the TABS array and activeTab logic.
new_lines = []
for line in healthy_lines:
    if 'const activeTab = (searchParams.get("tab") || "players") as TabId;' in line or "const activeTab = (searchParams.get('tab') || 'players') as TabId;" in line:
        new_lines.append('  const activeTab = (searchParams.get("tab") || "leaderboard") as TabId;')
    elif 'const TABS = [' in line:
        new_lines.append(line)
    elif '{ id: "penalize", label: "Penalize a Player", icon: AlertTriangle },' in line or "{ id: 'penalize', label: 'Penalize a Player', icon: AlertTriangle }," in line:
        new_lines.append(line)
        new_lines.append('  { id: "leaderboard", label: "Live Leaderboard", icon: Trophy },')
    else:
        new_lines.append(line)

# Let's find where to insert the leaderboard code. 
# We can insert it right before `{/* Helper Modals */}`
insert_idx = -1
for i, line in enumerate(new_lines):
    if '{/* Helper Modals */}' in line:
        insert_idx = i
        break

if insert_idx != -1:
    new_lines = new_lines[:insert_idx] + leaderboard_code + new_lines[insert_idx:]

with open('app/super-admin/leaderboard/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

# For organizer, do the same but replace /super-admin/ with /organizer-admin/
organizer_lines = [line.replace('/super-admin/', '/organizer-admin/') for line in new_lines]
with open('app/organizer-admin/leaderboard/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write('\n'.join(organizer_lines))

# And fix organizer tournaments page
organizer_tournaments_lines = [line.replace('/super-admin/', '/organizer-admin/') for line in healthy_lines]
with open('app/organizer-admin/tournaments/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write('\n'.join(organizer_tournaments_lines))

print('Done fixing!')
