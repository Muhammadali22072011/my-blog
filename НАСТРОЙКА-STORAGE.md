# 🔧 Настройка Supabase Storage - Пошаговая инструкция

## 📋 Что нужно сделать

1. ✅ Создать buckets в Supabase Dashboard
2. ✅ Настроить политики доступа через SQL
3. ✅ Проверить работу загрузки

---

## 🚀 Шаг 1: Создание Buckets

### 1.1 Откройте Supabase Dashboard

1. Перейдите на https://supabase.com
2. Войдите в свой проект
3. В левом меню найдите **Storage**

### 1.2 Создайте bucket "images"

1. Нажмите кнопку **"New bucket"**
2. Заполните форму:
   ```
   Name: images
   Public bucket: ✅ ON (включите!)
   File size limit: 5242880 (5MB)
   Allowed MIME types: image/*
   ```
3. Нажмите **"Create bucket"**

### 1.3 Создайте bucket "videos"

1. Снова нажмите **"New bucket"**
2. Заполните форму:
   ```
   Name: videos
   Public bucket: ✅ ON (включите!)
   File size limit: 52428800 (50MB)
   Allowed MIME types: video/*
   ```
3. Нажмите **"Create bucket"**

### 1.4 Создайте bucket "avatars"

1. Снова нажмите **"New bucket"**
2. Заполните форму:
   ```
   Name: avatars
   Public bucket: ✅ ON (включите!)
   File size limit: 2097152 (2MB)
   Allowed MIME types: image/*
   ```
3. Нажмите **"Create bucket"**

### ✅ Результат:

Теперь у вас должно быть 3 bucket:
- 📁 **images** (Public, 5MB)
- 📁 **videos** (Public, 50MB)
- 📁 **avatars** (Public, 2MB)

---

## 🔐 Шаг 2: Настройка политик доступа

### 2.1 Откройте SQL Editor

1. В левом меню Supabase найдите **SQL Editor**
2. Нажмите **"New query"**

### 2.2 Выполните SQL скрипт

1. Откройте файл `setup-storage-complete.sql`
2. Скопируйте весь код
3. Вставьте в SQL Editor
4. Нажмите **"RUN"** (или Ctrl+Enter)

### 2.3 Проверьте результат

После выполнения скрипта вы увидите:
- ✅ Список buckets с настройками
- ✅ Список политик для каждого bucket
- ✅ Сообщение об успешном выполнении

---

## 🧪 Шаг 3: Тестирование

### 3.1 Тест через Dashboard

1. Перейдите в **Storage** → **images**
2. Нажмите **"Upload file"**
3. Выберите любое изображение
4. После загрузки нажмите на файл
5. Скопируйте **Public URL**
6. Откройте URL в браузере - изображение должно открыться!

### 3.2 Тест через код

Создайте тестовый файл `test-upload.js`:

```javascript
import supabaseService from './src/services/SupabaseService'

// Тест загрузки изображения
async function testImageUpload() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  
  input.onchange = async (e) => {
    const file = e.target.files[0]
    try {
      const result = await supabaseService.uploadImage(file)
      console.log('✅ Изображение загружено:', result.url)
      alert('Успех! URL: ' + result.url)
    } catch (error) {
      console.error('❌ Ошибка:', error)
      alert('Ошибка: ' + error.message)
    }
  }
  
  input.click()
}

// Тест загрузки видео
async function testVideoUpload() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'video/*'
  
  input.onchange = async (e) => {
    const file = e.target.files[0]
    try {
      const result = await supabaseService.uploadVideo(file)
      console.log('✅ Видео загружено:', result.url)
      alert('Успех! URL: ' + result.url)
    } catch (error) {
      console.error('❌ Ошибка:', error)
      alert('Ошибка: ' + error.message)
    }
  }
  
  input.click()
}

// Запустите в консоли браузера:
// testImageUpload()
// testVideoUpload()
```

### 3.3 Тест через компоненты

В админ-панели добавьте:

```jsx
import MediaUploader from './components/MediaUploader'

<MediaUploader 
  type="video"
  onMediaUploaded={(result) => {
    console.log('Загружено:', result.url)
    alert('Видео загружено! URL: ' + result.url)
  }}
/>
```

---

## 🔍 Проверка настроек

### Проверка buckets

Выполните в SQL Editor:

```sql
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name IN ('images', 'videos', 'avatars');
```

**Ожидаемый результат:**

| name    | public | file_size_limit | allowed_mime_types |
|---------|--------|-----------------|-------------------|
| images  | true   | 5242880         | ["image/*"]       |
| videos  | true   | 52428800        | ["video/*"]       |
| avatars | true   | 2097152         | ["image/*"]       |

### Проверка политик

Выполните в SQL Editor:

```sql
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'objects' 
  AND policyname LIKE '%videos%'
ORDER BY policyname;
```

**Ожидаемый результат:**

| policyname                  | cmd    |
|----------------------------|--------|
| Anyone can delete videos   | DELETE |
| Anyone can update videos   | UPDATE |
| Anyone can upload videos   | INSERT |
| Public can read videos     | SELECT |

---

## 🐛 Решение проблем

### Проблема 1: Bucket не создается

**Симптомы:** Ошибка при создании bucket

**Решение:**
1. Проверьте, что вы владелец проекта
2. Проверьте квоту Storage в вашем плане
3. Попробуйте другое имя bucket

### Проблема 2: Политики не применяются

**Симптомы:** Ошибка "permission denied" при загрузке

**Решение:**
1. Убедитесь, что bucket создан и публичный
2. Выполните SQL скрипт заново
3. Проверьте политики через SQL:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'objects';
   ```

### Проблема 3: Файлы не загружаются

**Симптомы:** Ошибка при загрузке файлов

**Решение:**
1. Проверьте размер файла (не превышает лимит?)
2. Проверьте формат файла (поддерживается?)
3. Проверьте консоль браузера для ошибок
4. Проверьте URL Supabase в `config/supabase.js`

### Проблема 4: Видео не воспроизводится

**Симптомы:** Видео загружено, но не воспроизводится

**Решение:**
1. Проверьте, что bucket публичный
2. Используйте MP4 формат с H.264 кодеком
3. Проверьте CORS настройки в Supabase
4. Откройте URL видео напрямую в браузере

---

## 📊 Структура Storage

После настройки структура будет такой:

```
Supabase Storage
├── images (Public, 5MB)
│   ├── blog-images/
│   │   ├── 1234567890-abc123.jpg
│   │   ├── 1234567891-def456.png
│   │   └── ...
│   └── other-images/
│       └── ...
├── videos (Public, 50MB)
│   ├── blog-videos/
│   │   ├── 1234567890-abc123.mp4
│   │   ├── 1234567891-def456.webm
│   │   └── ...
│   └── other-videos/
│       └── ...
└── avatars (Public, 2MB)
    ├── 1234567890-abc123.jpg
    ├── 1234567891-def456.png
    └── ...
```

---

## 🔒 Безопасность (опционально)

### Ограничение загрузки только для авторизованных

Если хотите, чтобы загружать файлы могли только авторизованные пользователи:

1. Откройте SQL Editor
2. Выполните:

```sql
-- Для images
DROP POLICY "Anyone can upload images" ON storage.objects;
CREATE POLICY "Authenticated can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Для videos
DROP POLICY "Anyone can upload videos" ON storage.objects;
CREATE POLICY "Authenticated can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

-- Для avatars
DROP POLICY "Anyone can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
```

---

## ✅ Чеклист настройки

Отметьте выполненные шаги:

- [ ] Открыл Supabase Dashboard
- [ ] Создал bucket "images" (Public: ON)
- [ ] Создал bucket "videos" (Public: ON)
- [ ] Создал bucket "avatars" (Public: ON)
- [ ] Открыл SQL Editor
- [ ] Выполнил `setup-storage-complete.sql`
- [ ] Проверил buckets через SQL
- [ ] Проверил политики через SQL
- [ ] Загрузил тестовое изображение через Dashboard
- [ ] Загрузил тестовое видео через Dashboard
- [ ] Проверил публичные URL
- [ ] Протестировал загрузку через код
- [ ] Протестировал компоненты MediaUploader
- [ ] Проверил воспроизведение видео в посте

---

## 🎉 Готово!

Теперь Storage полностью настроен и готов к использованию!

**Что дальше:**
1. Используйте `MediaUploader` для загрузки файлов
2. Используйте `MediaGallery` для просмотра загруженных файлов
3. Вставляйте видео в посты: `[🎥 Video: Название](URL)`
4. Наслаждайтесь кастомным видео-плеером! 🚀

**Полезные ссылки:**
- `README-CUSTOM-VIDEO-PLAYER.md` - полное руководство
- `MEDIA-UPLOAD-GUIDE.md` - детальная инструкция
- `MEDIA-CHEATSHEET.md` - быстрая шпаргалка
- `ВИДЕО-ИНСТРУКЦИЯ.md` - инструкция на русском
