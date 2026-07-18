import { redirect, notFound } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getRoomData } from "@/app/actions/room"
import { RoomView } from "@/components/room-view"

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const { id } = await params
  const roomId = Number(id)
  if (!Number.isInteger(roomId)) notFound()

  let data
  try {
    data = await getRoomData(roomId)
  } catch (error) {
    console.error("Error loading room data:", error)
    notFound()
  }

  return <RoomView userName={session.user.name} userId={session.user.id} data={data} />
}
