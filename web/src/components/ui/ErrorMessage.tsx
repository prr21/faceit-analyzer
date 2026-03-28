interface ErrorMessageProps {
  /** Текст ошибки */
  message: string
  /** Callback для повторной попытки */
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-red-500 dark:text-red-400 text-4xl mb-4">!</div>
      <p className="text-gray-700 dark:text-gray-300 mb-2">Произошла ошибка</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="cursor-pointer px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Попробовать снова
        </button>
      )}
    </div>
  )
}
