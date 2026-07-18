"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createRoom, joinRoom, type RoomSummary } from "@/app/actions/rooms"
import { Plus, LogIn, Users, Crown, ChevronRight, Trophy } from "lucide-react"

export function Dashboard({ userName, rooms }: { userName: string; rooms: RoomSummary[] }) {
  const router = useRouter()

  return (
    <div className="min-h-svh bg-background">
      <AppHeader userName={userName} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">Tus ligas</h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            Crea una liga nueva para ser el admin o únete a la de tus amigos con un código.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CreateRoomDialog onCreated={(id) => router.push(`/room/${id}`)} />
          <JoinRoomDialog onJoined={(id) => router.push(`/room/${id}`)} />
        </div>

        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Trophy className="h-6 w-6" />
            </span>
            <p className="text-sm font-medium text-foreground">Aún no estás en ninguna liga</p>
            <p className="mt-1 text-sm text-muted-foreground">Crea una o únete con un código para empezar.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {rooms.map((room) => (
              <li key={room.id}>
                <button
                  onClick={() => router.push(`/room/${room.id}`)}
                  className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/40"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-base font-semibold text-card-foreground">{room.name}</span>
                      {room.isAdmin && (
                        <Badge variant="secondary" className="gap-1">
                          <Crown className="h-3 w-3" /> Admin
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {room.members}
                      </span>
                      <span className="font-mono tracking-widest">{room.code}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}

function CreateRoomDialog({ onCreated }: { onCreated: (roomId: number) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [pending, startTransition] = useTransition()

  const submit = () => {
    startTransition(async () => {
      const res = await createRoom(name)
      if (!res.ok) {
        toast.error(res.error ?? "No se pudo crear la liga")
        return
      }
      toast.success("Liga creada. ¡Eres el administrador!")
      setOpen(false)
      setName("")
      if (res.roomId) onCreated(res.roomId)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" className="h-auto flex-col items-start gap-1 py-4" />}>
        <span className="flex items-center gap-2 text-base font-semibold">
          <Plus className="h-5 w-5" /> Crear liga
        </span>
        <span className="text-xs font-normal opacity-90">Serás el administrador</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear una liga</DialogTitle>
          <DialogDescription>Ponle un nombre. Se generará un código para invitar a tus amigos.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="room-name">Nombre de la liga</Label>
          <Input
            id="room-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. La quiniela del grupo"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) submit()
            }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending} className="w-full">
            {pending ? "Creando..." : "Crear liga"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function JoinRoomDialog({ onJoined }: { onJoined: (roomId: number) => void }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [pending, startTransition] = useTransition()

  const submit = () => {
    startTransition(async () => {
      const res = await joinRoom(code)
      if (!res.ok) {
        toast.error(res.error ?? "No se pudo unir a la liga")
        return
      }
      toast.success("¡Te has unido a la liga!")
      setOpen(false)
      setCode("")
      if (res.roomId) onJoined(res.roomId)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" variant="secondary" className="h-auto flex-col items-start gap-1 py-4" />}>
        <span className="flex items-center gap-2 text-base font-semibold">
          <LogIn className="h-5 w-5" /> Unirse con código
        </span>
        <span className="text-xs font-normal opacity-90">Entra en la liga de un amigo</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unirse a una liga</DialogTitle>
          <DialogDescription>Introduce el código de 6 caracteres que te ha pasado el admin.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="room-code">Código de la liga</Label>
          <Input
            id="room-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="text-center font-mono text-lg tracking-[0.3em]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) submit()
            }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending} className="w-full">
            {pending ? "Uniéndote..." : "Unirse"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
