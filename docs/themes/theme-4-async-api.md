# Тема 4 — Асинхронное взаимодействие с API

## Теория

### Fetch API

`fetch` — встроенная функция браузера для HTTP-запросов. Возвращает Promise, который разрешается в объект `Response`. Важно: `fetch` не выбрасывает ошибку при HTTP-ошибках (404, 500) — нужно проверять `response.ok` вручную.

```ts
const response = await fetch('/api/player/nickname')
if (!response.ok) throw new Error(`HTTP ${response.status}`)
const data = await response.json()
```

### AbortController

При размонтировании компонента (например, пользователь ушёл со страницы) незавершённые запросы нужно отменять — иначе произойдёт попытка обновить состояние уже несуществующего компонента (утечка памяти).

```ts
useEffect(() => {
  const controller = new AbortController()
  fetch(url, { signal: controller.signal })
    .then(res => res.json())
    .then(setData)
    .catch(err => {
      if (err.name !== 'AbortError') setError(err)
    })
  return () => controller.abort() // cleanup при размонтировании
}, [url])
```

### Debounce

Debounce — паттерн, откладывающий выполнение функции до тех пор, пока пользователь не прекратит действие (ввод текста). Каждый новый вызов сбрасывает таймер. Это предотвращает отправку запроса на каждое нажатие клавиши.

```ts
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
```

### Паттерн loading / error / data

Стандартный подход к управлению состоянием асинхронных операций — три переменные:
- `loading: boolean` — идёт ли запрос
- `error: string | null` — текст ошибки (или null)
- `data: T | null` — полученные данные (или null)

## Документация

- [MDN: Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [MDN: setTimeout](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout)
- [React: useEffect](https://react.dev/reference/react/useEffect)
- [React: useState](https://react.dev/reference/react/useState)

---

## Задания

### Задание 4.1 — Динамическая загрузка данных

**Файлы:**
- `web/src/features/theme-4-async/hooks/usePlayerData.ts` — кастомный хук загрузки
- `web/src/main.tsx` — альтернативная точка входа
- `web/src/components/core/LoadingSpinner.tsx` — спиннер (готов)
- `web/src/components/core/ErrorMessage.tsx` — сообщение об ошибке (готов)

**TODO:** 2 маркера

**Зависимость:** Требуется работающий сервер (Тема 3)

**Что нужно сделать:**
1. В `usePlayerData.ts` — реализовать `useEffect` с `fetch` + `AbortController`: отправить запрос к `/api/player/:nickname`, обработать loading/error/data
2. В `main.tsx` — создать компонент `AppWithDynamicData`, который использует хук и передаёт данные в `App`

**Проверка:** Запустите сервер (`cd server && npm run dev`) и фронтенд (`cd web && npm run dev`). Откройте `localhost:5173?player=nickname` — данные должны загружаться динамически с отображением спиннера.

---

### Задание 4.2 — Поиск с debounce

**Файлы:**
- `web/src/features/theme-4-async/hooks/useDebounce.ts` — хук debounce
- `web/src/features/theme-4-async/ui/PlayerSearch.tsx` — компонент поиска
- `web/src/components/Layout.tsx` — подключение в шапку (раскомментировать)

**TODO:** 3 маркера

**Зависимость:** Требуется работающий сервер (Тема 3)

**Что нужно сделать:**
1. В `useDebounce.ts` — реализовать `setTimeout` + `clearTimeout` через `useEffect`
2. В `PlayerSearch.tsx` — подключить debounce к полю ввода, отправить запрос к `/api/search`, отобразить результаты
3. В `Layout.tsx` — раскомментировать импорт `PlayerSearch` и слот в шапке

**Проверка:** В шапке появится поле поиска. При вводе 3+ символов через 300мс отправится запрос и отобразятся результаты.
