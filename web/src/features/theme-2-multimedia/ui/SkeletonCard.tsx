interface SkeletonCardProps {
  variant?: "sm" | "md" | "lg"
}

const sizes = {
  sm: "h-16",
  md: "h-24",
  lg: "h-36",
}

export function SkeletonCard({ variant = "md" }: SkeletonCardProps) {
  return (
    <div
      className={`
        flex-1 min-w-[100px] sm:min-w-[140px]
        bg-gray-200 dark:bg-gray-700
        rounded-lg ${sizes[variant]}
        animate-shimmer overflow-hidden
      `}
    >
      <div className="p-3 sm:p-4 space-y-2">
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3" />
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-2/3" />
        {variant !== "sm" && (
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
        )}
      </div>
    </div>
  )
}
