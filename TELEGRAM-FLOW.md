# 🔄 Как работает превью в Telegram

## Текущая ситуация (ДО исправления)

```
┌─────────────────┐
│  Пост в БД      │
│  id: 98         │
│  featured_image:│
│  ❌ NULL        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  BlogPost.jsx   │
│  getFullImage() │
│  ❌ Нет image   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SEOHead.jsx    │
│  og:image       │
│  ❌ Не создан   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  HTML страницы  │
│  <meta og:image>│
│  ❌ Отсутствует │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Telegram       │
│  Парсит HTML    │
│  ❌ Нет картинки│
└─────────────────┘

РЕЗУЛЬТАТ: Только текст, без картинки 😢
```

## После исправления (ПОСЛЕ)

```
┌─────────────────────────────────────┐
│  1. Создать/загрузить картинку      │
│     create-default-og-image.html    │
│     ↓                               │
│     cybersecurity-post-98.png       │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  2. Загрузить в Supabase Storage    │
│     images/blog-images/             │
│     cybersecurity-post-98.png       │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  3. Обновить пост в БД              │
│     UPDATE posts                    │
│     SET featured_image = '...'      │
│     WHERE id = 98                   │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  4. Пользователь открывает пост     │
│     https://izzatullaev.uz/post/98  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  5. BlogPost.jsx загружает данные   │
│     post.featured_image ✅          │
│     ↓                               │
│     getFullImageUrl()               │
│     ↓                               │
│     https://rfppkhwqnlkpjemmoexg... │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  6. SEOHead.jsx создаёт OG теги     │
│     <meta property="og:image"       │
│           content="https://..." />  │
│     <meta property="og:image:width" │
│           content="1200" />         │
│     <meta property="og:image:height"│
│           content="630" />          │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  7. HTML страницы содержит OG теги  │
│     ✅ og:title                     │
│     ✅ og:description               │
│     ✅ og:image                     │
│     ✅ og:image:width               │
│     ✅ og:image:height              │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  8. Telegram парсит страницу        │
│     Находит og:image ✅             │
│     Загружает картинку ✅           │
│     Создаёт превью ✅               │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  9. РЕЗУЛЬТАТ                       │
│     ┌─────────────────────────────┐ │
│     │ 🛡️  [КАРТИНКА]             │ │
│     │ Кибербезопасность для       │ │
│     │ обычного человека           │ │
│     └─────────────────────────────┘ │
│     https://izzatullaev.uz/post/98  │
└─────────────────────────────────────┘

РЕЗУЛЬТАТ: Красивое превью с картинкой! 🎉
```

## Технические детали

### Формат URL изображения

```
Неправильно ❌:
  /images/blog-images/file.png
  images/blog-images/file.png

Правильно ✅:
  https://rfppkhwqnlkpjemmoexg.supabase.co/storage/v1/object/public/images/blog-images/file.png
```

### Приоритет изображений

```javascript
// BlogPost.jsx
const ogImage = 
  getFullImageUrl(post.featured_image) ||  // 1. Приоритет
  getFullImageUrl(post.og_image) ||        // 2. Запасной
  getFirstImage(post.content)              // 3. Автопоиск
```

### OG теги для Telegram

```html
<!-- Обязательные -->
<meta property="og:title" content="Заголовок" />
<meta property="og:description" content="Описание" />
<meta property="og:image" content="https://..." />

<!-- Рекомендуемые -->
<meta property="og:image:secure_url" content="https://..." />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Заголовок" />
```

## Кэширование Telegram

```
┌─────────────────────────────────────┐
│  Первая отправка ссылки             │
│  Telegram парсит → сохраняет в кэш  │
│  Кэш живёт: 24 часа                 │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Повторная отправка                 │
│  Telegram берёт из кэша             │
│  ❌ Новое изображение не видно      │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  РЕШЕНИЕ: Очистить кэш              │
│  1. Facebook Debugger               │
│  2. Подождать 24 часа               │
│  3. Добавить ?v=2 к URL             │
└─────────────────────────────────────┘
```

## Отладка

### Console.log в браузере

```javascript
// BlogPost.jsx
console.log('🖼️ Post OG Image:', {
  featured_image: post.featured_image,
  og_image: post.og_image,
  final: ogImage
})

// SEOHead.jsx
console.log('🖼️ OG Image set for Telegram:', absoluteImageUrl)
```

### Проверка в браузере

```
F12 → Console:
  🖼️ Post OG Image: { ... }
  🖼️ OG Image set for Telegram: https://...

Ctrl+U → View Source:
  <meta property="og:image" content="https://..." />
```

## Размеры изображений

```
┌─────────────────────────────────────┐
│  Минимум:     200 x 200 px          │
│  Стандарт:    1200 x 630 px ✅      │
│  Максимум:    8192 x 8192 px        │
│  Размер:      до 5 MB               │
│  Формат:      JPG, PNG              │
└─────────────────────────────────────┘
```

## Что было исправлено

```diff
// SEOHead.jsx
- setMeta('og:image:type', 'image/png', true)
+ setMeta('og:image:type', 'image/jpeg', true)

+ console.log('🖼️ OG Image set for Telegram:', absoluteImageUrl)

// BlogPost.jsx
+ // Улучшена функция getFullImageUrl()
+ // Добавлена обработка разных форматов путей
+ // Добавлено логирование для отладки
```

## Итог

```
БЫЛО:
  ❌ Нет featured_image в БД
  ❌ Нет og:image в HTML
  ❌ Telegram не показывает картинку

СТАЛО:
  ✅ featured_image в БД
  ✅ og:image в HTML
  ✅ Telegram показывает красивое превью
```

---

**Время исправления:** 5 минут  
**Сложность:** Легко  
**Результат:** Профессиональные превью в Telegram 🚀
