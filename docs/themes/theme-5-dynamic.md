# Тема 5 — Динамическое обновление

## Теория

### Polling (периодический опрос)

Polling — простейший способ получать обновления с сервера: отправлять запрос через фиксированные интервалы времени. В React реализуется через `setInterval` внутри `useEffect` с обязательной очисткой (cleanup).

```ts
useEffect(() => {
  const id = setInterval(() => {
    fetchData().then(setData)
  }, interval)
  return () => clearInterval(id) // очистка при размонтировании
}, [interval])
```

**Важно:** Если `setInterval` не очистить при размонтировании компонента, запросы продолжат выполняться "в фоне", вызывая утечку памяти и ошибки.

### Promise.allSettled

При параллельной загрузке данных нескольких пользователей один запрос может упасть, а другой — успешно завершиться. `Promise.all` отклонит весь результат при первой ошибке. `Promise.allSettled` дождётся завершения всех промисов и вернёт статус каждого отдельно:

```ts
const results = await Promise.allSettled([
  fetch('/api/player/player1').then(r => r.json()),
  fetch('/api/player/player2').then(r => r.json()),
])

results.forEach((result, i) => {
  if (result.status === 'fulfilled') {
    // result.value — данные
  } else {
    // result.reason — ошибка
  }
})
```

### Визуализация "свежести" данных

Для индикатора обновления полезно отслеживать, сколько времени прошло с последнего обновления. `Performance.now()` или `Date.now()` дают текущее время; разница с временем последнего обновления показывает "возраст" данных.

## Документация

- [MDN: setInterval](https://developer.mozilla.org/en-US/docs/Web/API/setInterval)
- [MDN: Promise.allSettled](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)
- [MDN: Performance.now()](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now)
- [React: useEffect](https://react.dev/reference/react/useEffect)
- [React: useRef](https://react.dev/reference/react/useRef)

---

## Задания

### Задание 5.1 — Сравнение двух игроков

**Файлы:**
- `web/src/features/theme-5-dynamic/tabs/CompareTab.tsx` — форма и логика сравнения
- `web/src/features/theme-5-dynamic/ui/CompareView.tsx` — отображение результатов

**TODO:** 2 маркера

**Зависимость:** Требуется работающий сервер (Тема 3)

**Что нужно сделать:**
1. В `CompareTab.tsx` — реализовать `handleCompare`: отправить два параллельных запроса через `Promise.allSettled`, обработать результаты (один может упасть)
2. В `CompareView.tsx` — отобразить метрики двух игроков рядом (ELO, WR, KD, лучшая карта)

**Проверка:** Откройте таб "Сравнение", введите два никнейма, нажмите "Сравнить" — должно появиться side-by-side сравнение с метриками.

---

### Задание 5.2 — Автообновление данных

**Файлы:**
- `web/src/features/theme-5-dynamic/hooks/usePolling.ts` — хук периодического опроса
- `web/src/features/theme-5-dynamic/ui/RefreshIndicator.tsx` — индикатор обновления
- `web/src/components/Layout.tsx` — подключение индикатора (раскомментировать)

**TODO:** 4 маркера

**Зависимость:** Требуется Задание 4.1 (usePlayerData)

**Что нужно сделать:**
1. В `usePolling.ts` — реализовать `doFetch` (функция запроса), `setInterval` для периодического вызова, ручное обновление по кнопке
2. В `RefreshIndicator.tsx` — вычислить прошедшее время с последнего обновления, отобразить прогресс-бар
3. В `Layout.tsx` — раскомментировать импорт `RefreshIndicator` и слот, подключить реальные значения

**Проверка:** В шапке появится прогресс-бар, показывающий время до следующего обновления. Кнопка "Обновить" должна запускать немедленный запрос.
