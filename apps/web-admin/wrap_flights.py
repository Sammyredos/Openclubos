import re

files = [
    r'app/organizer-admin/tournaments/[id]/page.tsx',
    r'app/super-admin/leaderboard/[id]/page.tsx',
    r'app/organizer-admin/leaderboard/[id]/page.tsx'
]

c = 0
for f in files:
    with open(f, encoding='utf-8') as file:
        content = file.read()
    
    original = content
    
    # We want to wrap the header, search, and tabs in a card.
    # We find {/* Groupings Dashboard Header */} and wrap until right before {/* Flights Grid */}
    
    # Also for Skeletons?
    # {/* Groupings Dashboard Header Skeleton */} until {/* Flights Grid Skeleton */}
    
    # First, let's do the actual content.
    start_str = '{/* Groupings Dashboard Header */}'
    end_str = '{/* Flights Grid */}'
    
    if start_str in content and end_str in content:
        start_idx = content.find(start_str)
        end_idx = content.find(end_str)
        
        inner = content[start_idx:end_idx]
        
        # Check if already wrapped
        if 'bg-background rounded-xl border border-[#e1efe5] p-5 space-y-6' not in inner:
            # We want to wrap it like:
            # <div className="bg-background rounded-xl border border-[#e1efe5] p-5 mb-8">
            #   {inner}
            # </div>
            # Wait, the inner already has some margins (mb-8). We can remove mb-8 from the header inside, 
            # or just leave them.
            
            wrapped_inner = '<div className="bg-background rounded-xl border border-[#e1efe5] p-5 mb-8">\n' + inner + '\n</div>\n'
            
            content = content[:start_idx] + wrapped_inner + content[end_idx:]
            
            with open(f, 'w', encoding='utf-8') as file:
                file.write(content)
            c += 1

print(f'Updated {c} files')
