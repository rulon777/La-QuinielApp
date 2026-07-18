"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trophy } from "lucide-react"

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === "sign-up"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      setError(traducirError(error.message ?? ""))
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <main className="min-h-svh bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Trophy className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
            {isSignUp ? "Crea tu cuenta" : "La Porra"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            {isSignUp
              ? "Regístrate para empezar a predecir con tus amigos"
              : "Inicia sesión para entrar en tus salas"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Tu nombre"
                  autoComplete="name"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tucorreo@ejemplo.com"
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Espera un momento..." : isSignUp ? "Crear cuenta" : "Entrar"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? "¿Ya tienes cuenta? " : "¿Aún no tienes cuenta? "}
          <Link
            href={isSignUp ? "/sign-in" : "/sign-up"}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {isSignUp ? "Inicia sesión" : "Regístrate"}
          </Link>
        </p>
      </div>
    </main>
  )
}

function traducirError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("invalid") && m.includes("password")) return "Correo o contraseña incorrectos."
  if (m.includes("invalid email")) return "El correo no es válido."
  if (m.includes("already") || m.includes("exist")) return "Ya existe una cuenta con ese correo."
  if (m.includes("password")) return "La contraseña debe tener al menos 8 caracteres."
  return message || "Algo salió mal. Inténtalo de nuevo."
}
