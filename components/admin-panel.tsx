"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  addMatch,
  deleteMatch,
  setMatchResult,
  getRoomMembersForAdmin,
  adjustMemberPoints,
  expelMember,
  getBannedMembers,
  unbanMember,
  type MatchWithPrediction,
  type RoomMemberAdminInfo,
  type BannedMemberInfo,
} from "@/app/actions/room"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus,
  Trash2,
  Flag,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Settings,
  MoreVertical,
  ArrowLeft,
  Users,
  RefreshCw,
  Ban,
  UserX,
  PlusCircle,
  MinusCircle,
} from "lucide-react"

export function AdminPanel({
  roomId,
  matches,
  weeks,
}: {
  roomId: number
  matches: MatchWithPrediction[]
  weeks: number[]
}) {
  const nextWeek = weeks.length > 0 ? Math.max(...weeks) + 1 : 1

  return (
    <div className="flex flex-col gap-6">
      <ManageLeagueSection roomId={roomId} />
      <AddMatchForm roomId={roomId} defaultWeek={nextWeek} />
      <ManageMatches roomId={roomId} matches={matches} />
    </div>
  )
}

function ManageLeagueSection({ roomId }: { roomId: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<"members" | "banned" | "adjust">("members")
  const [members, setMembers] = useState<RoomMemberAdminInfo[]>([])
  const [banned, setBanned] = useState<BannedMemberInfo[]>([])
  const [loading, setLoading] = useState(false)

  const [selectedMember, setSelectedMember] = useState<RoomMemberAdminInfo | null>(null)
  const [manualAciertosInput, setManualAciertosInput] = useState("0")
  const [manualClavadasInput, setManualClavadasInput] = useState("0")

  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null)
  const [actionPending, setActionPending] = useState(false)

  const loadMembers = async () => {
    setLoading(true)
    try {
      const data = await getRoomMembersForAdmin(roomId)
      setMembers(data)
    } catch (err) {
      toast.error("Error al cargar los participantes")
    } finally {
      setLoading(false)
    }
  }

  const loadBanned = async () => {
    setLoading(true)
    try {
      const data = await getBannedMembers(roomId)
      setBanned(data)
    } catch (err) {
      toast.error("Error al cargar participantes expulsados")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      setView("members")
      setSelectedMember(null)
      setOpenMenuUserId(null)
      loadMembers()
    }
  }

  const handleExpel = async (targetUserId: string) => {
    if (confirm("¿Estás seguro de que quieres expulsar a este participante? No podrá volver a ingresar a la liga.")) {
      setActionPending(true)
      try {
        const res = await expelMember(roomId, targetUserId)
        if (res.ok) {
          toast.success("Participante expulsado correctamente")
          loadMembers()
        } else {
          toast.error(res.error ?? "No se pudo expulsar al participante")
        }
      } catch {
        toast.error("Error al expulsar al participante")
      } finally {
        setActionPending(false)
        setOpenMenuUserId(null)
      }
    }
  }

  const handleUnban = async (targetUserId: string) => {
    setActionPending(true)
    try {
      const res = await unbanMember(roomId, targetUserId)
      if (res.ok) {
        toast.success("Veto revocado correctamente")
        loadBanned()
      } else {
        toast.error(res.error ?? "No se pudo revocar el veto")
      }
    } catch {
      toast.error("Error al revocar el veto")
    } finally {
      setActionPending(false)
    }
  }

  const handleSaveAdjustment = async () => {
    if (!selectedMember) return
    const aciertos = Number(manualAciertosInput)
    const clavadas = Number(manualClavadasInput)
    if (isNaN(aciertos) || isNaN(clavadas)) {
      toast.error("Por favor ingresa valores válidos")
      return
    }

    setActionPending(true)
    try {
      const res = await adjustMemberPoints(roomId, selectedMember.userId, aciertos, clavadas)
      if (res.ok) {
        toast.success("Puntos ajustados correctamente")
        setView("members")
        loadMembers()
      } else {
        toast.error(res.error ?? "No se pudo guardar el ajuste")
      }
    } catch {
      toast.error("Error al ajustar puntos")
    } finally {
      setActionPending(false)
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-card-foreground">Gestión de la Liga</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Expulsa participantes o ajusta sus puntos manuales.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger render={<Button className="font-semibold flex items-center gap-1.5 shrink-0" variant="outline" />}>
            <Settings className="h-4 w-4" /> Administrar liga
          </DialogTrigger>
          <DialogContent className="max-w-md w-full max-h-[85vh] flex flex-col p-6">
            {view === "members" && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" /> Participantes de la liga
                  </DialogTitle>
                  <DialogDescription>
                    Administra a los usuarios que participan en esta quiniela.
                  </DialogDescription>
                </DialogHeader>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm">Cargando participantes...</span>
                  </div>
                ) : members.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No hay participantes en la liga.
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-1 my-4 flex flex-col gap-2 max-h-[40vh]">
                    {members.map((m) => (
                      <div
                        key={m.userId}
                        className="flex items-center justify-between rounded-xl border border-border/80 bg-accent/20 px-4 py-3 transition-colors hover:bg-accent/40 relative"
                      >
                        <span className="text-sm font-semibold text-foreground truncate max-w-[70%]">
                          {m.userName}
                        </span>
                        <div className="relative shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setOpenMenuUserId(openMenuUserId === m.userId ? null : m.userId)}
                          >
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          {openMenuUserId === m.userId && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setOpenMenuUserId(null)} />
                              <div className="absolute right-0 mt-1 z-50 w-44 rounded-xl border border-border/60 bg-popover p-1 shadow-lg select-none">
                                <button
                                  onClick={() => {
                                    setSelectedMember(m)
                                    setManualAciertosInput(String(m.manualAciertos))
                                    setManualClavadasInput(String(m.manualClavadas))
                                    setOpenMenuUserId(null)
                                    setView("adjust")
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                                >
                                  <Settings className="h-3.5 w-3.5 text-muted-foreground" /> Ajustar puntos
                                </button>
                                <button
                                  onClick={() => handleExpel(m.userId)}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                  disabled={actionPending}
                                >
                                  <UserX className="h-3.5 w-3.5" /> Expulsar de la liga
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    variant="destructive"
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center justify-center gap-2"
                    onClick={() => {
                      setView("banned")
                      loadBanned()
                    }}
                  >
                    <Ban className="h-4 w-4" /> Participantes expulsados
                  </Button>
                </div>
              </>
            )}

            {view === "banned" && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 -ml-2"
                      onClick={() => {
                        setView("members")
                        loadMembers()
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <DialogTitle className="flex items-center gap-2 text-red-600 font-bold">
                      <Ban className="h-5 w-5" /> Participantes expulsados
                    </DialogTitle>
                  </div>
                  <DialogDescription>
                    Listado de participantes vetados. No podrán volver a entrar a la liga.
                  </DialogDescription>
                </DialogHeader>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                    <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
                    <span className="text-sm">Cargando expulsados...</span>
                  </div>
                ) : banned.length === 0 ? (
                  <div className="py-12 text-center text-sm font-semibold text-muted-foreground bg-accent/10 rounded-xl border border-dashed border-border/80 my-4">
                    Aún no se ha expulsado ningún participante.
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-1 my-4 flex flex-col gap-2 max-h-[40vh]">
                    {banned.map((b) => (
                      <div
                        key={b.userId}
                        className="flex items-center justify-between rounded-xl border border-border/80 bg-red-500/5 px-4 py-3 transition-colors hover:bg-red-500/10"
                      >
                        <span className="text-sm font-semibold text-foreground truncate max-w-[65%]">
                          {b.userName}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs font-semibold text-primary border-primary/30 hover:bg-primary/10 shrink-0"
                          onClick={() => handleUnban(b.userId)}
                          disabled={actionPending}
                        >
                          Quitar veto
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  variant="secondary"
                  className="w-full font-semibold"
                  onClick={() => {
                    setView("members")
                    loadMembers()
                  }}
                >
                  Volver
                </Button>
              </>
            )}

            {view === "adjust" && selectedMember && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 -ml-2"
                      onClick={() => setView("members")}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <DialogTitle className="flex items-center gap-2">
                      Ajustar puntos de {selectedMember.userName}
                    </DialogTitle>
                  </div>
                  <DialogDescription>
                    Modifica la cantidad de aciertos y clavadas del usuario para alterar sus puntos finales.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 my-4">
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-semibold">Pronósticos conseguidos:</span>
                      <span className="font-semibold text-foreground">
                        {selectedMember.calculatedAciertos} aciertos, {selectedMember.calculatedClavadas} clavadas
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-border/40 pt-2.5">
                      <span className="text-muted-foreground font-semibold">Proyección de puntos final:</span>
                      <span className="font-bold text-primary text-sm">
                        {((selectedMember.calculatedAciertos + Number(manualAciertosInput || 0)) * 2) +
                          ((selectedMember.calculatedClavadas + Number(manualClavadasInput || 0)) * 4)}{" "}
                        puntos
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground italic text-center">
                      Fórmula: (Aciertos * 2 pts) + (Clavadas * 4 pts)
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="manualAciertos" className="font-semibold text-xs text-foreground">
                        Ajuste de Aciertos (pueden ser negativos)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setManualAciertosInput(String(Number(manualAciertosInput || 0) - 1))}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <Input
                          id="manualAciertos"
                          type="number"
                          className="text-center font-bold text-base h-9"
                          value={manualAciertosInput}
                          onChange={(e) => setManualAciertosInput(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setManualAciertosInput(String(Number(manualAciertosInput || 0) + 1))}
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="manualClavadas" className="font-semibold text-xs text-foreground">
                        Ajuste de Clavadas (pueden ser negativos)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setManualClavadasInput(String(Number(manualClavadasInput || 0) - 1))}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <Input
                          id="manualClavadas"
                          type="number"
                          className="text-center font-bold text-base h-9"
                          value={manualClavadasInput}
                          onChange={(e) => setManualClavadasInput(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setManualClavadasInput(String(Number(manualClavadasInput || 0) + 1))}
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="font-semibold"
                    onClick={() => setView("members")}
                    disabled={actionPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="font-semibold"
                    onClick={handleSaveAdjustment}
                    disabled={actionPending}
                  >
                    {actionPending ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}

function AddMatchForm({ roomId, defaultWeek }: { roomId: number; defaultWeek: number }) {
  const [week, setWeek] = useState(String(defaultWeek))
  const [home, setHome] = useState("")
  const [away, setAway] = useState("")
  const [startTime, setStartTime] = useState("")
  const [pending, startTransition] = useTransition()

  const submit = () => {
    const w = Number(week)
    if (!Number.isInteger(w) || w < 1) {
      toast.error("Jornada no válida")
      return
    }
    if (!home.trim() || !away.trim()) {
      toast.error("Indica ambos equipos")
      return
    }
    if (!startTime) {
      toast.error("Indica la fecha y hora de inicio")
      return
    }
    startTransition(async () => {
      const isoStartTime = new Date(startTime).toISOString()
      const res = await addMatch(roomId, { week: w, homeTeam: home, awayTeam: away, startTime: isoStartTime })
      if (!res.ok) {
        toast.error(res.error ?? "No se pudo añadir")
        return
      }
      toast.success("Partido añadido")
      setHome("")
      setAway("")
      setStartTime("")
    })
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-card-foreground">
        <Plus className="h-4 w-4 text-primary" /> Añadir partido
      </h2>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="week">Jornada</Label>
            <Input
              id="week"
              inputMode="numeric"
              value={week}
              onChange={(e) => setWeek(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="startTime">Fecha y hora de inicio</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="home">Equipo local</Label>
            <Input id="home" value={home} onChange={(e) => setHome(e.target.value)} placeholder="Ej. Real Madrid" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="away">Equipo visitante</Label>
            <Input id="away" value={away} onChange={(e) => setAway(e.target.value)} placeholder="Ej. Barcelona" />
          </div>
        </div>
        <Button onClick={submit} disabled={pending} className="w-full sm:w-auto">
          {pending ? "Añadiendo..." : "Añadir partido"}
        </Button>
      </div>
    </section>
  )
}

function ManageMatches({ roomId, matches }: { roomId: number; matches: MatchWithPrediction[] }) {
  const byWeek = useMemo(() => {
    const map = new Map<number, MatchWithPrediction[]>()
    for (const m of matches) {
      const arr = map.get(m.week) ?? []
      arr.push(m)
      map.set(m.week, arr)
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  }, [matches])

  if (matches.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
        No hay partidos aún. Añade el primero arriba.
      </p>
    )
  }

  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-foreground">Resultados</h2>
      <div className="flex flex-col gap-6">
        {byWeek.map(([week, weekMatches]) => (
          <AdminWeekSection
            key={week}
            week={week}
            weekMatches={weekMatches}
            roomId={roomId}
          />
        ))}
      </div>
    </section>
  )
}

function AdminWeekSection({
  week,
  weekMatches,
  roomId,
}: {
  week: number
  weekMatches: MatchWithPrediction[]
  roomId: number
}) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="border-b border-border/60 pb-4 last:border-0 last:pb-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mb-2 flex items-center justify-between w-full text-left text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors py-1 rounded-lg outline-none"
      >
        <span className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" /> Jornada {week}
        </span>
        <span className="text-xs font-normal text-muted-foreground/80 flex items-center gap-1 select-none">
          {weekMatches.length} {weekMatches.length === 1 ? "partido" : "partidos"}
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
      </button>

      {isOpen && (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {weekMatches.map((m) => (
            <ResultRow key={m.id} roomId={roomId} match={m} />
          ))}
        </div>
      )}
    </div>
  )
}

function ResultRow({ roomId, match }: { roomId: number; match: MatchWithPrediction }) {
  const [home, setHome] = useState(match.homeScore !== null ? String(match.homeScore) : "")
  const [away, setAway] = useState(match.awayScore !== null ? String(match.awayScore) : "")
  const [pending, startTransition] = useTransition()
  const [deleting, startDelete] = useTransition()

  const saveResult = () => {
    const h = Number(home)
    const a = Number(away)
    if (home === "" || away === "" || !Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) {
      toast.error("Marcador no válido")
      return
    }
    startTransition(async () => {
      const res = await setMatchResult(roomId, match.id, h, a)
      if (!res.ok) {
        toast.error(res.error ?? "No se pudo guardar")
        return
      }
      toast.success("Resultado guardado y puntos calculados")
    })
  }

  const remove = () => {
    startDelete(async () => {
      const res = await deleteMatch(roomId, match.id)
      if (!res.ok) {
        toast.error(res.error ?? "No se pudo eliminar")
        return
      }
      toast.success("Partido eliminado")
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <span className="truncate text-sm font-medium text-card-foreground font-semibold">
            {match.homeTeam} <span className="text-muted-foreground font-normal">vs</span> {match.awayTeam}
          </span>
          {match.startTime && (
            <span className="mt-0.5 text-xs text-muted-foreground">
              {new Date(match.startTime).toLocaleString("es-ES", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </span>
          )}
        </div>
        {match.finished && (
          <Badge variant="secondary" className="gap-1 shrink-0">
            <Flag className="h-3 w-3" /> Finalizado
          </Badge>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Input
          inputMode="numeric"
          aria-label={`Goles ${match.homeTeam}`}
          value={home}
          onChange={(e) => setHome(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
          className="h-11 w-14 text-center text-lg font-bold"
          placeholder="0"
        />
        <span className="text-muted-foreground">-</span>
        <Input
          inputMode="numeric"
          aria-label={`Goles ${match.awayTeam}`}
          value={away}
          onChange={(e) => setAway(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
          className="h-11 w-14 text-center text-lg font-bold"
          placeholder="0"
        />
        <Button size="sm" onClick={saveResult} disabled={pending} className="ml-auto">
          {pending ? "Guardando..." : match.finished ? "Corregir" : "Guardar resultado"}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={remove}
          disabled={deleting}
          aria-label="Eliminar partido"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
