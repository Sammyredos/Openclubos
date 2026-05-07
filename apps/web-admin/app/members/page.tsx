"use client"

import * as React from "react"
import { 
  getMembers, 
  createMember, 
  updateMember, 
  deleteMember,
  Member 
} from "@/lib/api/members"
import { Button } from "@/components/ui/button"
import { Input, SearchableSelect } from "@/components/ui/input"
import { Icons } from "@/components/ui/icons"
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  UserPlus, 
  RefreshCcw,
  Edit,
  Trash2,
  Trophy,
  ShieldCheck,
  Ban,
  Clock
} from "lucide-react"
import { toast } from "sonner"
import { Pagination } from "@/components/ui/pagination"

export default function MembersPage() {
  const [members, setMembers] = React.useState<Member[]>([])
  const [total, setTotal] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [page, setPage] = React.useState(1)
  const take = 10

  const fetchMembers = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getMembers({
        skip: (page - 1) * take,
        take,
        search,
        status: statusFilter
      })
      setMembers(data.items)
      setTotal(data.total)
    } catch (error) {
      toast.error("Failed to load members")
    } finally {
      setIsLoading(false)
    }
  }, [page, search, statusFilter])

  React.useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return
    try {
      await deleteMember(id)
      toast.success("Member deleted")
      fetchMembers()
    } catch (error) {
      toast.error("Failed to delete member")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-nexa-bold bg-emerald-50 text-emerald-600">
          <ShieldCheck className="w-3 h-3" /> Active
        </span>
      case 'EXPIRED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-nexa-bold bg-amber-50 text-amber-600">
          <Clock className="w-3 h-3" /> Expired
        </span>
      case 'SUSPENDED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-nexa-bold bg-red-50 text-red-600">
          <Ban className="w-3 h-3" /> Suspended
        </span>
      default:
        return null
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-nexa-regular">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-nexa-bold text-gray-900 tracking-tight">Members Management</h1>
          <p className="text-gray-500 mt-1">Manage club members, handicaps, and statuses.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white border border-primary/60 gap-2 h-11 px-6 rounded-lg">
          <UserPlus className="w-5 h-5" />
          Add New Member
        </Button>
      </div>

      {/* Stats Bar (Subtle) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-nexa-bold uppercase tracking-wider">Total Members</p>
            <p className="text-2xl font-nexa-bold text-gray-900">{total}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-nexa-bold uppercase tracking-wider">Avg. Handicap</p>
            <p className="text-2xl font-nexa-bold text-gray-900">14.2</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-nexa-bold uppercase tracking-wider">Expired Today</p>
            <p className="text-2xl font-nexa-bold text-gray-900">3</p>
          </div>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by name or email..." 
            className="pl-12 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-primary transition-colors rounded-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <SearchableSelect
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={[
              { value: "", label: "All Statuses" },
              { value: "ACTIVE", label: "Active" },
              { value: "EXPIRED", label: "Expired" },
              { value: "SUSPENDED", label: "Suspended" },
            ]}
            className="min-w-[160px]"
            triggerClassName="h-12 bg-white font-nexa-bold text-[15px]"
            placeholder="All Statuses"
          />
          <Button 
            onClick={fetchMembers}
            variant="outline" 
            className="h-12 w-12 p-0 rounded-lg border-gray-200 hover:bg-gray-50"
          >
            <RefreshCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <Icons.spinner className="w-10 h-10 text-primary animate-spin" />
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-5 text-[12px] font-nexa-bold text-gray-500 uppercase tracking-widest">Member</th>
                <th className="px-6 py-5 text-[12px] font-nexa-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-[12px] font-nexa-bold text-gray-500 uppercase tracking-widest text-center">Handicap</th>
                <th className="px-6 py-5 text-[12px] font-nexa-bold text-gray-500 uppercase tracking-widest">Club</th>
                <th className="px-6 py-5 text-[12px] font-nexa-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.length > 0 ? members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-nexa-bold">
                        {member.firstName[0]}{member.lastName[0]}
                      </div>
                      <div>
                        <div className="font-nexa-bold text-[15px] text-gray-900">{member.firstName} {member.lastName}</div>
                        <div className="text-[14px] text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {getStatusBadge(member.status)}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="font-nexa-bold text-[15px] text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
                      {member.handicap.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[14px] text-gray-600 italic">
                      {member.club?.name || 'No Club'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="w-9 h-9 text-gray-400 hover:text-primary rounded-lg">
                        <Edit className="w-4.5 h-4.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-9 h-9 text-gray-400 hover:text-red-500 rounded-lg"
                        onClick={() => handleDelete(member.id)}
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-nexa-bold">
                    No members found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing <span className="font-nexa-bold text-gray-900">{(page - 1) * take + 1}</span> to <span className="font-nexa-bold text-gray-900">{Math.min(page * take, total)}</span> of <span className="font-nexa-bold text-gray-900">{total}</span> members
          </p>
          <Pagination 
            currentPage={page}
            totalPages={Math.ceil(total / take)}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  )
}
