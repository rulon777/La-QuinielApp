"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { room, roomMember, roomBanned } from "@/lib/db/schema"
import { and, desc, eq, inArray, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { generarCodigoSala } from "@/lib/scoring"

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("No autorizado")
  return session.user
}

export type RoomSummary = {
  id: number
  name: string
  code: string
  isAdmin: boolean
  members: number
}

// Devuelve todas las salas a las que pertenece el usuario.
export async function getMyRooms(): Promise<RoomSummary[]> {
  const user = await getUser()

  const memberships = await db
    .select({ roomId: roomMember.roomId })
    .from(roomMember)
    .where(eq(roomMember.userId, user.id))

  const roomIds = memberships.map((m) => m.roomId)
  if (roomIds.length === 0) return []

  const rooms = await db.select().from(room).where(inArray(room.id, roomIds)).orderBy(desc(room.createdAt))

  const counts = await db
    .select({ roomId: roomMember.roomId, count: sql<number>`count(*)::int` })
    .from(roomMember)
    .where(inArray(roomMember.roomId, roomIds))
    .groupBy(roomMember.roomId)

  const countMap = new Map(counts.map((c) => [c.roomId, c.count]))

  return rooms.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    isAdmin: r.adminId === user.id,
    members: countMap.get(r.id) ?? 0,
  }))
}

// Crea una sala. El creador es el admin y se une automáticamente.
export async function createRoom(name: string): Promise<{ ok: boolean; error?: string; roomId?: number }> {
  const user = await getUser()
  const trimmed = name.trim()
  if (trimmed.length < 3) return { ok: false, error: "El nombre debe tener al menos 3 caracteres." }

  // Genera un código único (reintenta ante colisiones improbables).
  let code = generarCodigoSala()
  for (let i = 0; i < 5; i++) {
    const existing = await db.select({ id: room.id }).from(room).where(eq(room.code, code)).limit(1)
    if (existing.length === 0) break
    code = generarCodigoSala()
  }

  const [created] = await db.insert(room).values({ name: trimmed, code, adminId: user.id }).returning()

  await db.insert(roomMember).values({
    roomId: created.id,
    userId: user.id,
    userName: user.name,
  })

  revalidatePath("/")
  return { ok: true, roomId: created.id }
}

// Une al usuario a una sala mediante su código.
export async function joinRoom(code: string): Promise<{ ok: boolean; error?: string; roomId?: number }> {
  const user = await getUser()
  const normalized = code.trim().toUpperCase()
  if (normalized.length !== 6) return { ok: false, error: "El código debe tener 6 caracteres." }

  const [found] = await db.select().from(room).where(eq(room.code, normalized)).limit(1)
  if (!found) return { ok: false, error: "No existe ninguna sala con ese código." }

  // Verificar si el usuario está expulsado
  const [isBanned] = await db
    .select()
    .from(roomBanned)
    .where(and(eq(roomBanned.roomId, found.id), eq(roomBanned.userId, user.id)))
    .limit(1)

  if (isBanned) {
    return { ok: false, error: "Has sido expulsado de esta liga por el admin." }
  }

  const existing = await db
    .select({ id: roomMember.id })
    .from(roomMember)
    .where(and(eq(roomMember.roomId, found.id), eq(roomMember.userId, user.id)))
    .limit(1)

  if (existing.length === 0) {
    await db.insert(roomMember).values({
      roomId: found.id,
      userId: user.id,
      userName: user.name,
    })
  }

  revalidatePath("/")
  return { ok: true, roomId: found.id }
}
