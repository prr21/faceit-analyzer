export function uniqueByField<T>(array: T[], field: keyof T): T[] {
  const seen = new Set<unknown>()
  return array.filter(item => {
    const value = item[field]
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
}

export function replaceLangPlaceholder(url: string, lang = "en"): string {
  return url.replace("{lang}", lang)
}
