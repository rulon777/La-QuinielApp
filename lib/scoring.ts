// Reglas de puntuación:
// - 4 puntos si aciertas el marcador exacto
// - 2 puntos si aciertas el resultado (gana local / empate / gana visitante)
// - 0 puntos en cualquier otro caso
export function calcularPuntos(
  predHome: number,
  predAway: number,
  realHome: number,
  realAway: number,
): number {
  if (predHome === realHome && predAway === realAway) return 4
  const signo = (a: number, b: number) => (a > b ? 1 : a < b ? -1 : 0)
  if (signo(predHome, predAway) === signo(realHome, realAway)) return 2
  return 0
}

// Genera un código de sala legible (sin caracteres ambiguos).
export function generarCodigoSala(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
