# Тема 6 — Unit-тестирование

## Теория

### Зачем нужны тесты

Тесты — автоматическая проверка того, что код работает правильно. Без тестов каждое изменение — риск сломать что-то незаметно. С тестами можно уверенно рефакторить код, зная, что ошибка будет обнаружена мгновенно.

### Unit-тесты vs интеграционные

- **Unit-тесты** — тестируют одну функцию/модуль изолированно. Быстрые, точные, легко находят причину ошибки.
- **Интеграционные тесты** — тестируют взаимодействие нескольких компонентов. Медленнее, но проверяют реальные сценарии.

### Паттерн AAA (Arrange, Act, Assert)

Каждый тест состоит из трёх частей:

```ts
it('returns green for high win rate', () => {
  // Arrange — подготовка данных
  const winRate = 65

  // Act — вызов тестируемой функции
  const color = getStatColor('winRate', winRate)

  // Assert — проверка результата
  expect(color).toBe('text-green-600')
})
```

### Vitest

Vitest — фреймворк для тестирования, совместимый с Vite. Ключевые функции:

- `describe('группа', () => {...})` — группировка тестов
- `it('описание', () => {...})` — один тест
- `expect(value).toBe(expected)` — проверка значения
- `test.each([...])('шаблон', (input, expected) => {...})` — параметризованные тесты

### Тестирование React-хуков

Хуки нельзя вызвать вне компонента. `renderHook` из Testing Library создаёт "невидимый" компонент для хука:

```ts
const { result } = renderHook(() => useTheme())
expect(result.current.isDark).toBe(false)

act(() => result.current.toggleTheme())
expect(result.current.isDark).toBe(true)
```

### Мокирование browser API

В тестовой среде (jsdom) некоторые API отсутствуют или работают иначе. Их нужно мокировать:

```ts
// localStorage
const store: Record<string, string> = {}
vi.spyOn(Storage.prototype, 'getItem').mockImplementation(key => store[key] ?? null)

// matchMedia
window.matchMedia = vi.fn().mockReturnValue({ matches: false })
```

## Документация

- [Vitest: API Reference](https://vitest.dev/api/)
- [React Testing Library: renderHook](https://testing-library.com/docs/react-testing-library/api#renderhook)
- [jest-dom: Custom Matchers](https://github.com/testing-library/jest-dom)
- [Vitest: Mocking](https://vitest.dev/guide/mocking)

---

## Задание

### Задание 6.1 — Unit-тесты утилит и хуков

**Файлы:**
- `web/src/__tests__/colors.test.ts` — тесты цветовой системы
- `web/src/__tests__/useTheme.test.ts` — тесты хука темы
- `web/src/__tests__/fixtures/mockData.ts` — тестовые данные (готов)
- `web/src/__tests__/setup.ts` — настройка окружения (готов)
- `web/vitest.config.ts` — конфигурация Vitest (готов)

**TODO:** 3 маркера (2 в colors.test.ts, 1 в useTheme.test.ts)

**Что нужно сделать:**
1. В `colors.test.ts` — дописать тесты для всех порогов цветовой системы: проверить `getStatColor` и `getStatBgColor` для каждого типа метрики (winRate, kd, adr, hs) и каждого тира (green, gray, orange, red)
2. В `useTheme.test.ts` — дописать тесты для хука: начальное состояние, переключение, сохранение в localStorage, чтение из localStorage, реакция на системную тему

**Проверка:**
```bash
cd web && npm test
# Все тесты должны пройти (зелёные)

npm run test:coverage
# Покрытие utils/colors.ts и hooks/useTheme.ts должно быть > 90%
```
