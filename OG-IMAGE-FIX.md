# Исправление Open Graph изображений для социальных сетей

## Проблема
При отправке ссылки на пост в Telegram/WhatsApp/Facebook не отображалось изображение в превью, показывалось только "No Description".

## Решение
Добавлена функция `getFullImageUrl()` которая преобразует относительные URL изображений в абсолютные URL для правильной работы Open Graph meta тегов.

### Что было исправлено:

1. **BlogPost.jsx** - Добавлена функция для преобразования `featured_image` в полный URL
2. **Blogs.jsx** - Добавлена та же функция для карточек постов в списке

### Как это работает:

```javascript
const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return null
  if (imageUrl.startsWith('http')) return imageUrl
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rfppkhwqnlkpjemmoexg.supabase.co'
  return `${supabaseUrl}/storage/v1/object/public/${imageUrl}`
}
```

### Приоритет изображений для OG тегов:

1. `post.featured_image` - основное изображение поста
2. `post.og_image` - специальное OG изображение
3. Первое изображение из контента поста

### Проверка:

1. Откройте любой пост с featured_image
2. Скопируйте URL поста
3. Отправьте в Telegram/WhatsApp
4. Должно отображаться изображение в превью

### Важно:

- Изображения должны быть загружены в Supabase Storage
- URL должен быть публично доступен
- Рекомендуемый размер: 1200x630px для лучшего отображения
