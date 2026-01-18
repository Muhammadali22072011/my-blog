# 🎬 Интеграция медиа в админ-панель

## Быстрая интеграция

### Добавьте в Admin.jsx:

```jsx
import MediaUploader from '../components/MediaUploader'
import MediaGallery from '../components/MediaGallery'

// В компоненте Admin добавьте состояние:
const [showMediaGallery, setShowMediaGallery] = useState(false)

// В редакторе постов добавьте кнопки:
<div className="flex gap-2 mb-4">
  <MediaUploader 
    type="image"
    onMediaUploaded={(result) => {
      // Вставляем изображение в контент
      const imageMarkdown = `\n![Изображение](${result.url})\n`
      setPostData(prev => ({
        ...prev,
        content: prev.content + imageMarkdown
      }))
    }}
  />
  
  <MediaUploader 
    type="video"
    onMediaUploaded={(result) => {
      // Вставляем видео в контент
      const videoMarkdown = `\n[🎥 Video: ${result.fileName}](${result.url})\n`
      setPostData(prev => ({
        ...prev,
        content: prev.content + videoMarkdown
      }))
    }}
  />
  
  <button
    onClick={() => setShowMediaGallery(!showMediaGallery)}
    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
  >
    📁 Галерея медиа
  </button>
</div>

{/* Галерея медиа */}
{showMediaGallery && (
  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
    <MediaGallery 
      onSelectMedia={(item) => {
        // Определяем тип файла
        const isVideo = item.type?.startsWith('video/')
        const markdown = isVideo 
          ? `\n[🎥 Video: ${item.name}](${item.url})\n`
          : `\n![${item.name}](${item.url})\n`
        
        // Вставляем в контент
        setPostData(prev => ({
          ...prev,
          content: prev.content + markdown
        }))
        
        // Закрываем галерею
        setShowMediaGallery(false)
      }}
    />
  </div>
)}
```

## Полный пример вкладки "Медиа"

Добавьте новую вкладку в админ-панель:

```jsx
// В Tab Navigation добавьте:
<button
  onClick={() => setActiveTab('media')}
  className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
    activeTab === 'media'
      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm transform scale-105'
      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
  }`}
>
  📁 Медиа
</button>

// В секции контента добавьте:
{activeTab === 'media' && (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-6">Управление медиа</h2>
    
    {/* Загрузка файлов */}
    <div className="mb-6 flex gap-4">
      <MediaUploader 
        type="image"
        onMediaUploaded={(result) => {
          alert('Изображение загружено! URL скопирован.')
          navigator.clipboard.writeText(result.url)
        }}
      />
      
      <MediaUploader 
        type="video"
        onMediaUploaded={(result) => {
          alert('Видео загружено! URL скопирован.')
          navigator.clipboard.writeText(result.url)
        }}
      />
    </div>
    
    {/* Галерея */}
    <MediaGallery 
      onSelectMedia={(item) => {
        console.log('Выбрано:', item)
      }}
    />
  </div>
)}
```

## Использование в постах

После загрузки медиа, вставьте в контент поста:

### Для изображений:
```markdown
![Описание](https://your-url.com/image.jpg)
```

### Для видео:
```markdown
[🎥 Video: Название](https://your-url.com/video.mp4)
```

Или с HTML:
```html
<video src="https://your-url.com/video.mp4" title="Название"></video>
```

## Готово! 🎉

Теперь в админ-панели есть полная поддержка медиа с кастомным видео-плеером!
