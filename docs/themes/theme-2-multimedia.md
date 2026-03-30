# Тема 2 — Мультимедиа и анимации

## Теория

### CSS-анимации

CSS предоставляет два механизма для создания движения:

- **Transitions** — плавный переход между двумя состояниями свойства (например, `opacity: 0 → 1` при наведении). Задаются через `transition: opacity 0.3s ease`.
- **Animations** — покадровые анимации через `@keyframes`. Позволяют задать промежуточные состояния (0%, 50%, 100%) и зацикливать анимацию.

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  animation: shimmer 1.5s infinite;
}
```

### requestAnimationFrame

Для анимации числовых значений в JavaScript используется `requestAnimationFrame` — браузер вызывает функцию перед каждой отрисовкой кадра (~60 раз/сек). Это эффективнее `setInterval` и синхронизировано с частотой обновления экрана.

```tsx
const animate = (timestamp: number) => {
  const progress = Math.min((timestamp - start) / duration, 1)
  setValue(Math.round(target * progress))
  if (progress < 1) requestAnimationFrame(animate)
}
requestAnimationFrame(animate)
```

### SVG в React

SVG-иконки можно встраивать прямо в JSX как inline-элементы. Это даёт возможность управлять цветами через `currentColor` (наследуется от родителя) и менять размер через пропсы.

### Accessibility

Важно уважать пользовательские настройки: `@media (prefers-reduced-motion: reduce)` позволяет отключить анимации для людей с вестибулярными расстройствами.

## Документация

- [MDN: CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations)
- [MDN: @keyframes](https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes)
- [MDN: requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
- [MDN: SVG Tutorial](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

---

## Задания

### Задание 2.1 — CSS-анимации и transition-эффекты

**Файлы:**
- `web/src/features/theme-2-multimedia/ui/SkeletonCard.tsx` — скелетон-заглушка
- `web/src/features/theme-2-multimedia/ui/AnimatedCounter.tsx` — анимированный счётчик
- `web/src/app.css` — keyframes и утилитарные классы

**TODO:** 3 маркера в компонентах + 2 в CSS

**Что нужно сделать:**
1. В `SkeletonCard.tsx` — применить CSS-класс shimmer-анимации
2. В `AnimatedCounter.tsx` — реализовать плавный отсчёт от 0 до целевого значения через `requestAnimationFrame`
3. В `app.css` — дописать keyframes для `countUp` и stagger-задержки для последовательного появления элементов

**Проверка:** Компоненты-скелетоны должны пульсировать при загрузке. Числовые значения в карточках должны плавно "нарастать" при появлении.

---

### Задание 2.2 — Изображения и SVG-иконки

**Файлы:**
- `web/src/features/theme-2-multimedia/ui/MapImage.tsx` — изображение карты с fallback
- `web/src/features/theme-2-multimedia/ui/StatIcon.tsx` — SVG-иконки метрик
- `web/public/maps/` — директория для изображений карт

**TODO:** 2 маркера + 1 BONUS

**Что нужно сделать:**
1. В `MapImage.tsx` — добавить `onError` обработчик и fallback (заглушка с первой буквой названия карты)
2. В `StatIcon.tsx` — добавить SVG path-элементы для иконок (kills, deaths, headshots, adr)
3. Поместить изображения карт (JPG/PNG) в `web/public/maps/` (формат: `de_dust2.jpg`)

**Проверка:** В таблицах должны отображаться миниатюры карт. При отсутствии изображения — fallback с буквой. SVG-иконки должны отображаться рядом со статистикой.
