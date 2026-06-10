import re
import sys

file_path = r'c:\Users\samue\Desktop\Openclubos\apps\web-admin\components\tournaments\CreateTournamentForm.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern for standard cards
pattern = re.compile(
    r'<div className=\"rounded-2xl border border-\[#e7e7e7\] bg-white p-6 space-y-(\d+)\">\s*'
    r'(?:<div className=\"space-y-6\">\s*)?'
    r'<div className=\"flex items-center gap-3\">\s*'
    r'<div className=\"w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600\">\s*'
    r'<(.*?) \/>\s*'
    r'<\/div>\s*'
    r'<div>\s*'
    r'<h4 className=\"text-\[14px\] font-bold text-gray-900\">(.*?)<\/h4>\s*'
    r'<p className=\"text-\[12px\] text-gray-500\">(.*?)<\/p>\s*'
    r'<\/div>\s*'
    r'<\/div>', re.DOTALL
)

def repl(m):
    space_y = m.group(1)
    icon = m.group(2)
    title = m.group(3)
    subtitle = m.group(4)
    return (f'<div className=\"rounded-2xl border border-[#e7e7e7] bg-white shadow-sm overflow-hidden\">\n'
            f'              <div className=\"px-5 py-4 border-b border-[#e7e7e7] bg-gray-50/50 flex items-center gap-3\">\n'
            f'                <div className=\"w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600\">\n'
            f'                  <{icon} />\n'
            f'                </div>\n'
            f'                <div>\n'
            f'                  <h4 className=\"text-[14px] font-bold text-gray-900\">{title}</h4>\n'
            f'                  <p className=\"text-[12px] text-gray-500\">{subtitle}</p>\n'
            f'                </div>\n'
            f'              </div>\n'
            f'              <div className=\"p-5 space-y-{space_y} bg-white\">\n'
            f'                <div className=\"space-y-6\">')

new_content = pattern.sub(repl, content)

# Pattern for toggle cards
pattern2 = re.compile(
    r'<div className=\"rounded-2xl border border-\[#e7e7e7\] bg-white p-6 space-y-(\d+)\">\s*'
    r'(?:<div className=\"space-y-4\">\s*)?'
    r'<div className=\"flex items-center justify-between cursor-pointer\" onClick=\{(.*?)\}>\s*'
    r'<div className=\"flex items-center gap-3\">\s*'
    r'<div className=\"w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600\">\s*'
    r'<(.*?) \/>\s*'
    r'<\/div>\s*'
    r'<div>\s*'
    r'<h4 className=\"text-\[14px\] font-bold text-gray-900\">(.*?)<\/h4>\s*'
    r'<p className=\"text-\[12px\] text-gray-500\">(.*?)<\/p>\s*'
    r'<\/div>\s*'
    r'<\/div>\s*'
    r'<div className=\{cn\(\"relative(.*?)\">\s*'
    r'<div className=\{cn\(\"absolute(.*?)\">\s*'
    r'<\/div>\s*'
    r'<\/div>\s*'
    r'<\/div>', re.DOTALL
)

def repl2(m):
    space_y = m.group(1)
    onclick = m.group(2)
    icon = m.group(3)
    title = m.group(4)
    subtitle = m.group(5)
    rel_classes = m.group(6)
    abs_classes = m.group(7)
    return (f'<div className=\"rounded-2xl border border-[#e7e7e7] bg-white shadow-sm overflow-hidden\">\n'
            f'              <div className=\"px-5 py-4 border-b border-[#e7e7e7] bg-gray-50/50 flex items-center justify-between cursor-pointer\" onClick={{{onclick}}}>\n'
            f'                <div className=\"flex items-center gap-3\">\n'
            f'                  <div className=\"w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600\">\n'
            f'                    <{icon} />\n'
            f'                  </div>\n'
            f'                  <div>\n'
            f'                    <h4 className=\"text-[14px] font-bold text-gray-900\">{title}</h4>\n'
            f'                    <p className=\"text-[12px] text-gray-500\">{subtitle}</p>\n'
            f'                  </div>\n'
            f'                </div>\n'
            f'                <div className={{cn("relative{rel_classes}>>\n'
            f'                  <div className={{cn("absolute{abs_classes}>>\n'
            f'                </div>\n'
            f'              </div>\n'
            f'              <div className=\"p-5 space-y-{space_y} bg-white\">\n'
            f'                <div className=\"space-y-4\">')

new_content = pattern2.sub(repl2, new_content)

# Fix the '>>' to ')} />' and ')}>' that I mangled for ease
new_content = new_content.replace('>>\\n', ')} />\\n')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Replaced standard cards.')
