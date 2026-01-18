# 📹 Руководство по загрузке медиа

## 🎬 Кастомный видео-плеер

В блоге реализован полнофункциональный кастомный видео-плеер с красивым дизайном.

### ✨ Возможности плеера:

- ▶️ **Play/Pause** - воспроизведение и пауза
- 🔊 **Громкость** - регулировка звука и mute
- ⏱️ **Прогресс-бар** - перемотка видео
- 🖥️ **Полноэкранный режим**
- 🎨 **Адаптивный дизайн** - работает на всех устройствах
- 🎯 **Автоскрытие контролов** - контролы скрываются при воспроизведении
- 📊 **Отображение времени** - текущее время и длительность

---

## 📤 Загрузка медиа

### 1️⃣ Через Supabase Storage (вручную)

1. Откройте Supabase Dashboard
2. Перейдите в **Storage**
3. Создайте buckets (если не созданы):
   - `images` - для изображений
   - `videos` - для видео
   - `avatars` - для аватарок
4. Установите buckets как **Public**
5. Загрузите файлы через интерфейс

### 2️⃣ Через код (программно)

```javascript
import supabaseService from '../services/SupabaseService'

// Загрузка изображения
const imageResult = await supabaseService.uploadImage(file, 'blog-images')
console.log('Image URL:', imageResult.url)

// Загрузка видео
const videoResult = await supabaseService.uploadVideo(file, 'blog-videos')
console.log('Video URL:', videoResult.url)
```

### 3️⃣ Через компонент MediaUploader

```jsx
import MediaUploader from '../components/MediaUploader'

<MediaUploader 
  type="both"  // 'image', 'video', или 'both'
  onMediaUploaded={(result) => {
    console.log('Загружено:', result.url)
  }}
/>
```

---

## 📝 Использование в постах

### Вариант 1: Markdown синтаксис

```markdown
# Мой пост с видео

Вот крутое видео:

[🎥 Video: Название видео](https://your-supabase-url.com/storage/v1/object/public/videos/video.mp4)

Текст после видео...
```

### Вариант 2: HTML тег

```markdown
# Мой пост

<video src="https://your-supabase-url.com/storage/v1/object/public/videos/video.mp4" title="Название видео"></video>

Продолжение поста...
```

### Вариант 3: Изображения

```markdown
![Описание изображения](https://your-supabase-url.com/storage/v1/object/public/images/image.jpg)
```

---

## 🎨 Компоненты

### CustomVideoPlayer

Кастомный видео-плеер с полным контролем.

```jsx
import CustomVideoPlayer from '../components/CustomVideoPlayer'

<CustomVideoPlayer 
  src="https://example.com/video.mp4"
  poster="https://example.com/poster.jpg"  // опционально
  title="Название видео"  // опционально
/>
```

### MediaUploader

Компонент для загрузки файлов.

```jsx
import MediaUploader from '../components/MediaUploader'

<MediaUploader 
  type="video"  // 'image', 'video', 'both'
  onMediaUploaded={(result) => {
    // result.url - URL загруженного файла
    // result.path - путь в storage
    // result.size - размер файла
  }}
/>
```

### MediaGallery

Галерея загруженных медиа-файлов.

```jsx
import MediaGallery from '../components/MediaGallery'

<MediaGallery 
  onSelectMedia={(item) => {
    console.log('Выбрано:', item.url)
  }}
/>
```

---

## ⚙️ Настройка Storage

### 1. Создание buckets

Выполните SQL в Supabase SQL Editor:

```sql
-- Создание buckets выполняется через Dashboard
-- Storage -> New bucket -> Имя: images, Public: ON
-- Storage -> New bucket -> Имя: videos, Public: ON
-- Storage -> New bucket -> Имя: avatars, Public: ON
```

### 2. Настройка политик доступа

Выполните файл `fix-storage-policies.sql`:

```bash
# В Supabase SQL Editor
# Откройте файл fix-storage-policies.sql
# Нажмите RUN
```

Это создаст политики для:
- ✅ Публичное чтение всех файлов
- ✅ Загрузка файлов (можно ограничить только для авторизованных)
- ✅ Обновление и удаление файлов

---

## 📊 Ограничения

### Размеры файлов:

- **Изображения**: до 5 MB
- **Аватарки**: до 2 MB
- **Видео**: до 50 MB

### Поддерживаемые форматы:

**Изображения:**
- JPG, JPEG
- PNG
- GIF
- WebP
- SVG

**Видео:**
- MP4 (рекомендуется)
- WebM
- AVI
- MOV
- MKV
- M4V

---

## 🔧 API методы

### SupabaseService

```javascript
// Загрузка изображения
uploadImage(file, folder = 'blog-images')

// Загрузка видео
uploadVideo(file, folder = 'blog-videos')

// Удаление изображения
deleteImage(filePath)

// Удаление видео
deleteVideo(filePath)

// Получение списка изображений
getImages(folder = 'blog-images')

// Получение списка видео
getVideos(folder = 'blog-videos')
```

---

## 🎯 Примеры использования

### Пример 1: Загрузка и вставка видео в пост

```jsx
const handleVideoUpload = async (file) => {
  try {
    const result = await supabaseService.uploadVideo(file)
    
    // Вставляем в контент поста
    const videoMarkdown = `[🎥 Video: ${file.name}](${result.url})`
    setPostContent(prev => prev + '\n\n' + videoMarkdown)
    
    alert('Видео загружено!')
  } catch (error) {
    alert('Ошибка: ' + error.message)
  }
}
```

### Пример 2: Галерея с выбором

```jsx
const [selectedMedia, setSelectedMedia] = useState(null)

<MediaGallery 
  onSelectMedia={(item) => {
    setSelectedMedia(item)
    // Вставляем в редактор
    insertIntoEditor(item.url)
  }}
/>
```

### Пример 3: Прямая загрузка

```jsx
<input 
  type="file" 
  accept="video/*"
  onChange={async (e) => {
    const file = e.target.files[0]
    if (file) {
      const result = await supabaseService.uploadVideo(file)
      console.log('Загружено:', result.url)
    }
  }}
/>
```

---

## 🐛 Решение проблем

### Видео не загружается

1. Проверьте, что bucket `videos` создан и публичный
2. Проверьте политики доступа (выполните `fix-storage-policies.sql`)
3. Проверьте размер файла (максимум 50 MB)
4. Проверьте формат файла (MP4 рекомендуется)

### Видео не воспроизводится

1. Проверьте URL видео (должен быть публичным)
2. Проверьте формат видео (MP4 с H.264 кодеком работает везде)
3. Откройте консоль браузера для ошибок

### Ошибка прав доступа

```sql
-- Выполните в Supabase SQL Editor
-- Это даст публичный доступ к чтению
CREATE POLICY "Public can read videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');
```

---

## 📚 Дополнительные ресурсы

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [HTML5 Video API](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video)
- [React Video Player](https://www.npmjs.com/package/react-player)

---

## ✅ Готово!

Теперь у вас есть полнофункциональная система загрузки и воспроизведения медиа с кастомным видео-плеером! 🎉
