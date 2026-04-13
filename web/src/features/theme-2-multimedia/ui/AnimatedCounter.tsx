import { useState, useEffect, useRef } from "react"

interface AnimatedCounterProps {
  value: number
  duration?: number
  suffix?: string
  decimals?: number
  className?: string
}

export function AnimatedCounter({
  value,
  duration = 1000,
  suffix = "",
  decimals = 0,
  className = "",
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    startTimeRef.current = null

    function animate(currentTime: number) {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime
      }
      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      setDisplayValue(eased * value)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [value, duration])

  const formatted = displayValue.toFixed(decimals)

  return (
    <span className={className}>
      {formatted}{suffix}
    </span>
  )
}
