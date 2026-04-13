import { useState } from "react"

interface MapImageProps {
  mapName: string
  size?: number
}

const FALLBACK_COLORS: Record<string, string> = {
  d: "bg-amber-500",
  m: "bg-blue-500",
  i: "bg-red-500",
  n: "bg-green-500",
  a: "bg-purple-500",
  v: "bg-cyan-500",
  o: "bg-pink-500",
  t: "bg-orange-500",
}

export function MapImage({ mapName, size = 32 }: MapImageProps) {
  const [hasError, setHasError] = useState(false)

  const shortName = mapName.replace("de_", "")
  const firstLetter = shortName.charAt(0).toLowerCase()
  const bgColor = FALLBACK_COLORS[firstLetter] || "bg-gray-500"

  if (!hasError) {
    return (
      <img
        src={`/maps/${mapName}.jpg`}
        alt={shortName}
        width={size}
        height={size}
        loading="lazy"
        className="rounded object-cover"
        onError={() => setHasError(true)}
      />
    )
  }

  return (
    <div
      className={`${bgColor} rounded flex items-center justify-center text-white font-bold text-xs`}
      style={{ width: size, height: size }}
    >
      {shortName.charAt(0).toUpperCase()}
    </div>
  )
}
