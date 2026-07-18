import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getMyRooms } from "@/app/actions/rooms"
import { Dashboard } from "@/components/dashboard"

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const rooms = await getMyRooms()

  return <Dashboard userName={session.user.name} rooms={rooms} />
}
