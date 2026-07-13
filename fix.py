import sys

with open(r'c:\Users\samue\Desktop\Openclubos\apps\web-admin\app\organizer-admin\members\page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1
for i in range(len(lines)):
    if '<Search className="absolute left-3.5 top-1/2' in lines[i] and 'handicapFilter' not in ''.join(lines[i-15:i]):
        if i > 730:
            start_idx = i
    if start_idx != -1 and i > start_idx and 'placeholder="All Status"' in lines[i]:
        end_idx = i + 2
        break

if start_idx != -1 and end_idx != -1:
    print('Removing duplicate block from line', start_idx + 1, 'to', end_idx)
    del lines[start_idx:end_idx]
else:
    print('Could not find duplicate block')

modal_header = """              {/* Header Section */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-8 border-b border-gray-50">
                <div className="relative">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedUser?.email || selectedUser?.id || "user")}`}
                    alt={selectedUser?.email || "User"}
                    className="h-24 w-24 rounded-full border-2 border-white shadow-md bg-background object-cover"
                  />
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white shadow-sm",
                    selectedUser?.status === "ACTIVE" ? "bg-openclub-700" : "bg-red-500"
                  )} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h4 className="text-[16px] font-normal text-gray-900 truncate">
                      {fullName(selectedUser?.firstName ?? null, selectedUser?.lastName ?? null)}
                    </h4>
                    {selectedUser && <StatusPill status={selectedUser.status} />}
                  </div>

                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                    <div className="flex items-center gap-2 text-[13px] text-gray-500 font-normal">
                      <Globe className="w-4 h-4 text-gray-400" />
                      {selectedUser?.email || "No email provided"}
                    </div>
                    <div className="w-1 h-1 rounded-full bg-gray-300 hidden sm:block" />
                    <div className="flex items-center gap-2 text-[13px] text-gray-500 font-normal">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="font-normal text-blue-600">
                        {selectedUser?.role === "CLUB_ADMIN" ? "ORGANISER ADMIN" : (selectedUser?.role?.replaceAll("_", " ") ?? "USER")}
                      </span>
                    </div>
                  </div>

                  <p className="text-[12px] text-gray-400 mt-2 font-normal flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Joined {formatJoinedDate(selectedUser?.createdAt || "")}
                  </p>
                </div>
              </div>
"""

header_start_idx = -1
header_end_idx = -1

for i in range(len(lines)):
    if 'return (' in lines[i] and 'className="space-y-8"' in lines[i+1]:
        header_start_idx = i + 2
    if header_start_idx != -1 and i > header_start_idx:
        if 'Joined {formatJoinedDate' in lines[i]:
            header_end_idx = i + 3
            break

if header_start_idx != -1 and header_end_idx != -1:
    print('Replacing modal header from', header_start_idx + 1, 'to', header_end_idx)
    lines = lines[:header_start_idx] + [modal_header] + lines[header_end_idx:]
else:
    print('Could not find modal header')

with open(r'c:\Users\samue\Desktop\Openclubos\apps\web-admin\app\organizer-admin\members\page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
