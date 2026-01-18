// Пример использования OG Image Preview в разных сценариях

import { useState } from 'react'
import OGImagePreview from '../components/OGImagePreview'

// Пример 1: Простое использование
function SimpleExample() {
  return (
    <OGImagePreview 
      title="Как улучшить SEO вашего блога"
      category="blog"
      postId={1}
    />
  )
}

// Пример 2: С динамическими данными
function DynamicExample() {
  const [post, setPost] = useState({
    id: 1,
    title: 'Мой первый пост',
    category: 'news'
  })

  return (
    <div>
      <input 
        value={post.title}
        onChange={(e) => setPost({...post, title: e.target.value})}
        placeholder="Введите название поста"
      />
      
      <select 
        value={post.category}
        onChange={(e) => setPost({...post, category: e.target.value})}
      >
        <option value="blog">Blog</option>
        <option value="news">News</option>
        <option value="tutorial">Tutorial</option>
        <option value="project">Project</option>
      </select>

      <OGImagePreview 
        title={post.title}
        category={post.category}
        postId={post.id}
      />
    </div>
  )
}

// Пример 3: Извлечение заголовка из Markdown
function MarkdownExample() {
  const markdownContent = `# Заголовок моего поста

Это содержимое поста с **жирным текстом** и *курсивом*.

## Подзаголовок

Еще немного текста...`

  // Функция для извлечения заголовка
  const extractTitle = (markdown) => {
    const lines = markdown.split('\n')
    for (const line of lines) {
      if (line.trim().startsWith('# ')) {
        return line.trim().substring(2)
      }
    }
    return 'Без названия'
  }

  return (
    <OGImagePreview 
      title={extractTitle(markdownContent)}
      category="tutorial"
      postId={123}
    />
  )
}

// Пример 4: В форме создания поста
function PostFormExample() {
  const [formData, setFormData] = useState({
    content: '# Новый пост\n\nСодержимое поста...',
    category: 'blog'
  })

  const getTitle = () => {
    const lines = formData.content.split('\n')
    for (const line of lines) {
      if (line.trim().startsWith('# ')) {
        return line.trim().substring(2)
      }
    }
    return 'Без названия'
  }

  return (
    <form>
      <textarea
        value={formData.content}
        onChange={(e) => setFormData({...formData, content: e.target.value})}
        rows={10}
        placeholder="# Заголовок поста\n\nСодержимое..."
      />

      <select
        value={formData.category}
        onChange={(e) => setFormData({...formData, category: e.target.value})}
      >
        <option value="blog">Blog</option>
        <option value="news">News</option>
        <option value="tutorial">Tutorial</option>
      </select>

      {/* Превью OG изображения */}
      <div className="mt-6">
        <h3>Превью для соцсетей:</h3>
        <OGImagePreview 
          title={getTitle()}
          category={formData.category}
          postId={null} // null для новых постов
        />
      </div>

      <button type="submit">Опубликовать</button>
    </form>
  )
}

export { SimpleExample, DynamicExample, MarkdownExample, PostFormExample }
