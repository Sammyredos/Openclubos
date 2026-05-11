"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createTournament } from "@/lib/api/tournaments"
import { getOrganizers } from "@/lib/api/organizers"
import { getCourses } from "@/lib/api/courses"
import { Button } from "@/components/ui/button"
import { Input, SearchableSelect } from "@/components/ui/input"
import { Icons } from "@/components/ui/icons"
import { formatThousandsInput, getTomorrowYMD } from "@/lib/utils"
import { DatePicker } from "@/components/ui/date-picker"
import { 
  Trophy, 
  Calendar, 
  Users, 
  DollarSign, 
  Target, 
  ArrowLeft,
  CheckCircle2,
  Info,
  ShieldCheck,
  Globe
} from "lucide-react"
import { toast } from "sonner"

const tournamentSchema = z.object({
  name: z.string().min(3, "Tournament name must be at least 3 characters"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  clubId: z.string().min(1, "Please select an organizer"),
  courseId: z.string().min(1, "Please select a course"),
  entryFee: z
    .union([z.literal(""), z.coerce.number().min(0)])
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  minHandicap: z
    .union([z.literal(""), z.coerce.number()])
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  maxHandicap: z
    .union([z.literal(""), z.coerce.number()])
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  maxPlayers: z
    .union([z.literal(""), z.coerce.number().int().min(1)])
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  registrationDeadline: z.string().optional(),
  playerTypes: z.array(z.string()).min(1, "Select at least one player type"),
})

type TournamentFormValues = z.infer<typeof tournamentSchema>

type OrganizerItem = { id: string; name: string }
type CourseItem = { id: string; name: string; holesCount?: number | null }

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message
  if (typeof e === "string") return e
  if (e && typeof e === "object" && "message" in e && typeof (e as { message?: unknown }).message === "string") {
    return (e as { message: string }).message
  }
  return null
}

export default function NewTournamentPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [organizers, setOrganizers] = React.useState<OrganizerItem[]>([])
  const [courses, setCourses] = React.useState<CourseItem[]>([])
  const [selectedOrganizer, setSelectedOrganizer] = React.useState("")

  const resolver = zodResolver(tournamentSchema) as unknown as Resolver<TournamentFormValues>
  const form = useForm<TournamentFormValues>({
    resolver,
    defaultValues: {
      name: "",
      startDate: "",
      clubId: "",
      courseId: "",
      playerTypes: ["MEMBER"],
    }
  })

  const startDate = form.watch("startDate")
  const endDate = form.watch("endDate")
  const tomorrowYMD = getTomorrowYMD()

  React.useEffect(() => {
    getOrganizers().then((data) => setOrganizers((Array.isArray(data) ? data : []) as OrganizerItem[]))
  }, [])

  React.useEffect(() => {
    if (selectedOrganizer) {
      getCourses(selectedOrganizer).then((data) => setCourses((Array.isArray(data) ? data : []) as CourseItem[]))
    } else {
      setCourses([])
    }
  }, [selectedOrganizer])

  React.useEffect(() => {
    if (startDate && endDate && endDate < startDate) {
      form.setValue("endDate", "", { shouldDirty: true, shouldValidate: true })
    }
    if (startDate && startDate < tomorrowYMD) {
      form.setValue("startDate", "", { shouldDirty: true, shouldValidate: true })
      toast.error("Start date must be from tomorrow onwards")
      return
    }
    if (endDate && endDate < tomorrowYMD) {
      form.setValue("endDate", "", { shouldDirty: true, shouldValidate: true })
      toast.error("End date must be from tomorrow onwards")
      return
    }
    const deadline = form.getValues("registrationDeadline")
    if (startDate && deadline && deadline > startDate) {
      form.setValue("registrationDeadline", startDate, { shouldDirty: true, shouldValidate: true })
    }
  }, [startDate, endDate, tomorrowYMD, form])

  const organizerOptions = React.useMemo(
    () => organizers.map((o) => ({ value: String(o.id), label: String(o.name) })),
    [organizers]
  )

  const courseOptions = React.useMemo(
    () =>
      courses.map((c) => ({
        value: String(c.id),
        label: `${String(c.name)} (${String(c.holesCount)} Holes)`,
      })),
    [courses]
  )

  async function onSubmit(data: TournamentFormValues) {
    setIsLoading(true)
    try {
      await createTournament(data)
      toast.success("Tournament created successfully")
      router.push("/tournaments")
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Failed to create tournament")
    } finally {
      setIsLoading(false)
    }
  }

  const togglePlayerType = (type: string) => {
    const current = form.getValues("playerTypes")
    if (current.includes(type)) {
      if (current.length > 1) {
        form.setValue("playerTypes", current.filter(t => t !== type))
      }
    } else {
      form.setValue("playerTypes", [...current, type])
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-nexa-regular">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Back Navigation */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-nexa-bold text-gray-500 hover:text-primary transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Tournaments
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Trophy className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-nexa-bold text-gray-900 tracking-tight">Setup New Tournament</h1>
            </div>
            <p className="text-gray-500 ml-13">Configure your event details, rules, and restrictions.</p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Section 1: Basic Info */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-nexa-bold text-gray-800">Basic Information</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2 col-span-full">
                <label className="text-sm font-nexa-bold text-gray-700 ml-1">Tournament Name</label>
                <Input 
                  placeholder="e.g. Annual Spring Open 2026" 
                  className="h-13 rounded-xl border-gray-200 focus:border-primary transition-all text-base"
                  {...form.register("name")}
                />
                {form.formState.errors.name && <p className="text-xs text-red-500 font-nexa-bold ml-1">{form.formState.errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-nexa-bold text-gray-700 ml-1">Organizer</label>
                <SearchableSelect
                  value={form.watch("clubId")}
                  onValueChange={(v) => {
                    form.setValue("clubId", v, { shouldDirty: true, shouldValidate: true })
                    setSelectedOrganizer(v)
                    form.setValue("courseId", "", { shouldDirty: true, shouldValidate: true })
                  }}
                  options={organizerOptions}
                  placeholder="Select an organizer..."
                />
                {form.formState.errors.clubId && <p className="text-xs text-red-500 font-nexa-bold ml-1">{form.formState.errors.clubId.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-nexa-bold text-gray-700 ml-1">Golf Course</label>
                <SearchableSelect
                  value={form.watch("courseId")}
                  onValueChange={(v) => form.setValue("courseId", v, { shouldDirty: true, shouldValidate: true })}
                  options={courseOptions}
                  placeholder="Select a course..."
                  disabled={!selectedOrganizer}
                />
                {form.formState.errors.courseId && <p className="text-xs text-red-500 font-nexa-bold ml-1">{form.formState.errors.courseId.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-nexa-bold text-gray-700 ml-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" /> Start Date
                </label>
                <Controller
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <DatePicker
                      value={String(field.value ?? "")}
                      onValueChange={field.onChange}
                      placeholder="Select start date"
                      minDate={tomorrowYMD}
                      onInvalidSelect={() => toast.error("Start date must be from tomorrow onwards")}
                      buttonClassName="h-13 rounded-xl border-gray-200 focus:border-primary transition-all text-base"
                    />
                  )}
                />
                {form.formState.errors.startDate && <p className="text-xs text-red-500 font-nexa-bold ml-1">{form.formState.errors.startDate.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-nexa-bold text-gray-700 ml-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" /> End Date (Optional)
                </label>
                <Controller
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <DatePicker
                      value={String(field.value ?? "")}
                      onValueChange={field.onChange}
                      placeholder="Select end date"
                      minDate={(startDate && startDate > tomorrowYMD ? startDate : tomorrowYMD) || undefined}
                      onInvalidSelect={({ reason }) => {
                        if (reason === "minDate") {
                          toast.error(startDate ? "End date cannot be before start date" : "End date must be from tomorrow onwards")
                          return
                        }
                        toast.error("End date must be from tomorrow onwards")
                      }}
                      allowClear
                      buttonClassName="h-13 rounded-xl border-gray-200 focus:border-primary transition-all text-base"
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Registration & Rules */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-nexa-bold text-gray-800">Registration & Requirements</h2>
            </div>
            <div className="p-8 space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-nexa-bold text-gray-700 ml-1 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-gray-400" /> Entry Fee
                  </label>
                  <Controller
                    control={form.control}
                    name="entryFee"
                    render={({ field }) => (
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="17,845"
                        className="h-13 rounded-xl"
                        name={field.name}
                        ref={field.ref}
                        value={formatThousandsInput(String(field.value ?? ""))}
                        onBlur={field.onBlur}
                        onChange={(e) => field.onChange(e.target.value.replace(/[^\d]/g, ""))}
                      />
                    )}
                  />
                  {form.formState.errors.entryFee && (
                    <p className="text-xs text-red-500 font-nexa-bold ml-1">
                      {String(form.formState.errors.entryFee.message)}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-nexa-bold text-gray-700 ml-1 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-gray-400" /> Max Players
                  </label>
                  <Controller
                    control={form.control}
                    name="maxPlayers"
                    render={({ field }) => (
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="100"
                        className="h-13 rounded-xl"
                        name={field.name}
                        ref={field.ref}
                        value={formatThousandsInput(String(field.value ?? ""))}
                        onBlur={field.onBlur}
                        onChange={(e) => field.onChange(e.target.value.replace(/[^\d]/g, ""))}
                      />
                    )}
                  />
                  {form.formState.errors.maxPlayers && (
                    <p className="text-xs text-red-500 font-nexa-bold ml-1">
                      {String(form.formState.errors.maxPlayers.message)}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-nexa-bold text-gray-700 ml-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" /> Reg. Deadline
                  </label>
                  <Controller
                    control={form.control}
                    name="registrationDeadline"
                    render={({ field }) => (
                      <DatePicker
                        value={String(field.value ?? "")}
                        onValueChange={field.onChange}
                        placeholder="Select deadline"
                        maxDate={startDate || undefined}
                        onInvalidSelect={() => toast.error("Registration deadline cannot be after the start date")}
                        allowClear
                        buttonClassName="h-13 rounded-xl border-gray-200 focus:border-primary transition-all text-base"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-nexa-bold text-gray-700 ml-1">Eligibility: Player Types</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'MEMBER', label: 'Users', icon: <ShieldCheck className="w-4 h-4" /> },
                    { id: 'EXTERNAL', label: 'External Players', icon: <Globe className="w-4 h-4" /> },
                    { id: 'GUEST', label: 'Guests', icon: <Users className="w-4 h-4" /> },
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => togglePlayerType(type.id)}
                      className={`flex items-center gap-2 px-5 py-3 rounded-lg font-nexa-bold text-sm transition-colors border ${
                        form.watch("playerTypes").includes(type.id)
                          ? "bg-primary text-white border-primary"
                          : "bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      {type.icon}
                      {type.label}
                    </button>
                  ))}
                </div>
                {form.formState.errors.playerTypes && <p className="text-xs text-red-500 font-nexa-bold ml-1">{form.formState.errors.playerTypes.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-50">
                <div className="space-y-2">
                  <label className="text-sm font-nexa-bold text-gray-700 ml-1">Minimum Handicap</label>
                  <Input type="number" step="0.1" placeholder="e.g. 0.0" className="h-13 rounded-xl" {...form.register("minHandicap")} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-nexa-bold text-gray-700 ml-1">Maximum Handicap</label>
                  <Input type="number" step="0.1" placeholder="e.g. 36.0" className="h-13 rounded-xl" {...form.register("maxHandicap")} />
                </div>
              </div>

            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="h-13 px-8 rounded-lg font-nexa-bold text-gray-500 hover:bg-gray-50"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="h-13 px-10 rounded-lg font-nexa-bold text-white bg-primary hover:bg-primary/90 border border-primary/60 flex items-center gap-2"
            >
              {isLoading ? (
                <Icons.spinner className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Create Tournament
                </>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}
