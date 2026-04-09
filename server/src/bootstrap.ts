import {
  createFaceitClient,
  getFaceitApiKey,
  setRetryLogger,
} from "@faceit/core"
import type { FaceitClient } from "@faceit/core"

export interface AppContext {
  client: FaceitClient
}

export function bootstrap(): AppContext {
  // Cache: по умолчанию FileSystemCache (установлен в core/)
  // Когда будет Redis — вызвать setCacheProvider(redisCache) здесь

  // Retry logger: префикс для серверных логов
  setRetryLogger((msg) => console.warn(`[retry] ${msg}`))

  // Создание FACEIT API клиента — один на весь сервер
  const client = createFaceitClient(getFaceitApiKey())

  return { client }
}
