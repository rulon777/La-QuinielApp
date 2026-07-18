"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { addMatch, deleteMatch, setMatchResult, type MatchWithPrediction } from "@/app/actions/room"
import { Plus, Trash2, Flag } from "lucide-react"

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
      <AddMatchForm roomId={roomId} defaultWeek={nextWeek} />
      <ManageMatches roomId={roomId} matches={matches} />
    </div>
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
      const res = await addMatch(roomId, { week: w, homeTeam: home, awayTeam: away, startTime })
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
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0])
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
          <div key={week}>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Jornada {week}</p>
            <div className="flex flex-col gap-3">
              {weekMatches.map((m) => (
                <ResultRow key={m.id} roomId={roomId} match={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
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
