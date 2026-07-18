"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AppHeader } from "@/components/app-header"
import { MatchList } from "@/components/match-list"
import { AdminPanel } from "@/components/admin-panel"
import { Leaderboard } from "@/components/leaderboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { RoomData } from "@/app/actions/room"
import { ArrowLeft, Copy, Crown, Check, RotateCw } from "lucide-react"

export function RoomView({
  userName,
  userId,
  data,
}: {
  userName: string
  userId: string
  data: RoomData
}) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const myPoints = data.leaderboard.find((r) => r.userId === userId)?.points ?? 0
  const myRank = data.leaderboard.findIndex((r) => r.userId === userId) + 1

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(data.code)
      setCopied(true)
      toast.success("Código copiado")
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("No se pudo copiar")
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => {
      setIsRefreshing(false)
      toast.success("Datos actualizados")
    }, 800)
  }

  return (
    <div className="min-h-svh bg-background">
      <AppHeader userName={userName} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Mis ligas
          </Link>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-all hover:bg-accent hover:text-foreground disabled:opacity-50"
            title="Refrescar datos"
          >
            <RotateCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
            <span>Refrescar</span>
          </button>
        </div>

        <div className="mb-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-xl font-bold tracking-tight text-card-foreground text-balance">
                  {data.name}
                </h1>
                {data.isAdmin && (
                  <Badge variant="secondary" className="gap-1 shrink-0">
                    <Crown className="h-3 w-3" /> Admin
                  </Badge>
                )}
              </div>
              <button
                onClick={copyCode}
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="font-mono text-base font-semibold tracking-[0.3em] text-foreground">
                  {data.code}
                </span>
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <div className="shrink-0 rounded-xl bg-primary/10 px-4 py-2 text-center">
              <p className="text-2xl font-bold leading-none text-primary">{myPoints}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {myRank > 0 ? `${myRank}º puesto` : "puntos"}
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="matches">
          <TabsList className={data.isAdmin ? "grid w-full grid-cols-3" : "grid w-full grid-cols-2"}>
            <TabsTrigger value="matches">Partidos</TabsTrigger>
            <TabsTrigger value="leaderboard">Clasificación</TabsTrigger>
            {data.isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="matches" className="mt-4">
            <MatchList roomId={data.id} matches={data.matches} isAdmin={data.isAdmin} userId={userId} />
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-4">
            <Leaderboard rows={data.leaderboard} currentUserId={userId} />
          </TabsContent>

          {data.isAdmin && (
            <TabsContent value="admin" className="mt-4">
              <AdminPanel roomId={data.id} matches={data.matches} weeks={data.weeks} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}
