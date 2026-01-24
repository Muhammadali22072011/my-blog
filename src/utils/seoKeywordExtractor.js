// Утилита для автоматического извлечения ключевых слов из текста

// Стоп-слова (не используются как ключевые слова)
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
  'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
  'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'just', 'there', 'here',
  // Русские стоп-слова
  'и', 'в', 'во', 'не', 'что', 'он', 'на', 'я', 'с', 'со', 'как', 'а',
  'то', 'все', 'она', 'так', 'его', 'но', 'да', 'ты', 'к', 'у', 'же',
  'вы', 'за', 'бы', 'по', 'только', 'ее', 'мне', 'было', 'вот', 'от',
  'меня', 'еще', 'нет', 'о', 'из', 'ему', 'теперь', 'когда', 'даже',
  'ну', 'вдруг', 'ли', 'если', 'уже', 'или', 'ни', 'быть', 'был',
  'него', 'до', 'вас', 'нибудь', 'опять', 'уж', 'вам', 'ведь', 'там',
  'потом', 'себя', 'ничего', 'ей', 'может', 'они', 'тут', 'где', 'есть',
  'надо', 'ней', 'для', 'мы', 'тебя', 'их', 'чем', 'была', 'сам', 'чтоб'
])

// Извлечение ключевых слов из текста
export const extractKeywords = (text, maxKeywords = 50) => {
  if (!text) return []

  // Очищаем текст от markdown и HTML
  const cleanText = text
    .replace(/[#*`_\[\]()]/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .toLowerCase()

  // Разбиваем на слова
  const words = cleanText
    .split(/\s+/)
    .filter(word => word.length > 2) // Минимум 3 символа (было 4)
    .filter(word => !STOP_WORDS.has(word))
    .filter(word => /^[a-zа-яё]+$/i.test(word)) // Только буквы

  // Подсчитываем частоту
  const frequency = {}
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1
  })

  // Сортируем по частоте и берем топ
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word)
}

// Генерация SEO-дружественного описания
export const generateMetaDescription = (content, maxLength = 160) => {
  if (!content) return ''

  // Убираем заголовки и форматирование
  const cleanContent = content
    .replace(/^#+ .*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/>\s.*/g, '')
    .replace(/- .*/g, '')
    .replace(/\n+/g, ' ')
    .trim()

  // Берем первое предложение или первые N символов
  const sentences = cleanContent.split(/[.!?]+/)
  let description = sentences[0]

  if (description.length > maxLength) {
    description = description.substring(0, maxLength - 3) + '...'
  }

  return description
}

// Генерация SEO-дружественного URL (slug)
export const generateSlug = (title) => {
  if (!title) return ''

  return title
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Анализ SEO качества контента
export const analyzeSEO = (post) => {
  const issues = []
  const suggestions = []

  // Проверка заголовка
  if (!post.title || post.title.length < 10) {
    issues.push('Заголовок слишком короткий (минимум 10 символов)')
  }
  if (post.title && post.title.length > 60) {
    issues.push('Заголовок слишком длинный (максимум 60 символов)')
  }

  // Проверка описания
  if (!post.description || post.description.length < 50) {
    issues.push('Описание слишком короткое (минимум 50 символов)')
  }
  if (post.description && post.description.length > 160) {
    issues.push('Описание слишком длинное (максимум 160 символов)')
  }

  // Проверка контента
  if (!post.content || post.content.length < 300) {
    issues.push('Контент слишком короткий (минимум 300 символов)')
  }

  // Проверка ключевых слов
  const keywords = extractKeywords(post.content)
  if (keywords.length < 3) {
    suggestions.push('Добавьте больше ключевых слов в контент')
  }

  // Проверка изображений
  if (!post.image && !post.og_image) {
    suggestions.push('Добавьте изображение для лучшего SEO')
  }

  // Проверка заголовков в контенте
  const hasH1 = /^# /m.test(post.content)
  const hasH2 = /^## /m.test(post.content)
  if (!hasH1) {
    issues.push('Отсутствует главный заголовок (H1)')
  }
  if (!hasH2) {
    suggestions.push('Добавьте подзаголовки (H2) для лучшей структуры')
  }

  // Оценка качества
  const score = Math.max(0, 100 - (issues.length * 15) - (suggestions.length * 5))

  return {
    score,
    issues,
    suggestions,
    keywords
  }
}
