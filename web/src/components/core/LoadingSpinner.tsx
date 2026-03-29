interface LoadingSpinnerProps {
  /** Текст под спиннером */
  message?: string
}

export function LoadingSpinner({ message = "Загрузка данных..." }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
      <div className="w-10 h-10 border-4 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin mb-4" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
