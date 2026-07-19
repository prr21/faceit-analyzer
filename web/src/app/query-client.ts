import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 мин — отчёты не меняются часто
      gcTime: 30 * 60 * 1000, // 30 мин garbage collection
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
