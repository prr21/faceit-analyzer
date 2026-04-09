/** Форматирует unix timestamp (секунды) в ISO-подобную строку "YYYY-MM-DD HH:MM:SS" */
export function formatTimestamp(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000)
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  )
}
