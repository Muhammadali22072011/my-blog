import { useState, useRef } from 'react'
import { translations } from '../translations'
import MediaInsertMenu from './MediaInsertMenu'
import { renderMarkdown } from '../utils/markdownRenderer.jsx'

function MCEditor({ value, onChange, placeholder, className = "" }) {
  const t = translations.ru
  const [isPreview, setIsPreview] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showMediaMenu, setShowMediaMenu] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const textareaRef = useRef(null)

  const insertText = (text) => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionStart
    const newContent = value.substring(0, start) + text + value.substring(end)
    onChange(newContent)
    
    // Set cursor after inserted text
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length, start + text.length)
    }, 0)
  }

  const insertImage = () => {
    if (imageUrl.trim()) {
      const imageMarkdown = `![Image](${imageUrl})`
      insertText(imageMarkdown)
      setImageUrl('')
      setShowImageModal(false)
    }
  }

  const insertVideo = () => {
    if (videoUrl.trim()) {
      const videoMarkdown = `[🎥 Video](${videoUrl})`
      insertText(videoMarkdown)
      setVideoUrl('')
      setShowVideoModal(false)
    }
  }

  const insertVideoHtml = (url) => {
    const videoHtml = `<video controls src="${url}" style="max-width: 100%; height: auto; margin: 10px 0;"></video>`
    insertText(videoHtml)
  }

  const insertImageHtml = (url, alt = '') => {
    const imageHtml = `<img src="${url}" alt="${alt}" style="max-width: 100%; height: auto; margin: 10px 0;" />`
    insertText(imageHtml)
  }

  const handleMediaInsert = (html) => {
    insertText(html)
  }

  return (
    <div className={className}>
      {/* Toolbar */}
      <div className="bg-gray-50 rounded-t-lg border border-gray-300 border-b-0 p-3">
        <div className="flex flex-wrap gap-2">
          {/* Headers */}
          <button
            type="button"
            onClick={() => insertText('# ')}
            className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-700 rounded text-sm font-medium border border-gray-300"
            title="Header 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => insertText('## ')}
            className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-700 rounded text-sm font-medium border border-gray-300"
            title="Header 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => insertText('### ')}
            className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-700 rounded text-sm font-medium border border-gray-300"
            title="Header 3"
          >
            H3
          </button>

          {/* Template */}
          <button
            type="button"
            onClick={() => insertText('# Заголовок\n\n++Краткое описание++\n\n## Введение\n\n*Вводная часть...*\n\n## Основная часть\n\n- Пункт 1\n- Пункт 2\n\n## Заключение\n\n**Выводы**\n')}
            className="px-3 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded text-sm font-medium border border-orange-300"
            title={t.createPostTemplate}
          >
            📝 {t.template}
          </button>

          {/* Formatting */}
          <button
            type="button"
            onClick={() => insertText('++bold text++')}
            className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-700 rounded text-sm font-bold border border-gray-300"
            title="Bold text"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => insertText('*italic*')}
            className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-700 rounded text-sm italic border border-gray-300"
            title="Italic"
          >
            I
          </button>

          {/* Lists */}
          <button
            type="button"
            onClick={() => insertText('- list item')}
            className="px-2 py-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded text-sm border border-yellow-300"
            title="List"
          >
            📝
          </button>
          <button
            type="button"
            onClick={() => insertText('1. list item')}
            className="px-2 py-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded text-sm border border-yellow-300"
            title="Numbered List"
          >
            1️⃣
          </button>

          {/* Links and Tables */}
          <button
            type="button"
            onClick={() => insertText('[link text](URL)')}
            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-sm border border-blue-300"
            title="Insert link"
          >
            🔗
          </button>
          <button
            type="button"
            onClick={() => insertText('| Header 1 | Header 2 | Header 3 |\n| --- | --- | --- |\n| Cell 1 | Cell 2 | Cell 3 |')}
            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-sm border border-indigo-300"
            title="Insert table"
          >
            📊
          </button>

          {/* Media */}
          <button
            type="button"
            onClick={() => setShowMediaMenu(true)}
            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-sm border border-blue-300"
            title={t.uploadViaButton}
          >
            📁 Медиа
          </button>
          <button
            type="button"
            onClick={() => setShowImageModal(true)}
            className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded text-sm border border-green-300"
            title="Insert image URL"
          >
            🖼️
          </button>
          <button
            type="button"
            onClick={() => setShowVideoModal(true)}
            className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-sm border border-purple-300"
            title="Insert video URL"
          >
            🎥
          </button>

          {/* Code */}
          <button
            type="button"
            onClick={() => insertText('`code`')}
            className="px-2 py-1 bg-gray-800 hover:bg-gray-900 text-white rounded text-sm border border-gray-700"
            title="Inline Code"
          >
            &lt;/&gt;
          </button>
          <button
            type="button"
            onClick={() => insertText('```\ncode block\n```')}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-800 text-white rounded text-sm border border-gray-600"
            title="Code Block"
          >
            📄
          </button>

          {/* Blockquote */}
          <button
            type="button"
            onClick={() => insertText('> quote text')}
            className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded text-sm border border-green-300"
            title="Blockquote"
          >
            💬
          </button>

          {/* Horizontal Rule */}
          <button
            type="button"
            onClick={() => insertText('\n---\n')}
            className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded text-sm border border-gray-300"
            title="Horizontal Rule"
          >
            ➖
          </button>

          {/* Instructions */}
          <button
            type="button"
            onClick={() => setShowInstructions(true)}
            className="px-3 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded text-sm font-medium border border-orange-300"
            title={t.instructionsTitle}
          >
            📖 {t.instructionsTitle}
          </button>

          {/* Mode toggle */}
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className={`px-3 py-1 rounded text-sm font-medium ml-auto border ${
              isPreview 
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                : 'bg-gray-600 text-white border-gray-600 hover:bg-gray-700'
            }`}
          >
            {isPreview ? t.edit : t.preview}
          </button>
        </div>
      </div>

      {/* Editing area */}
      <div className="border border-gray-300 rounded-b-lg">
        {isPreview ? (
          <div className="p-4 bg-white min-h-[200px]">
            {value ? renderMarkdown(value, { emptyText: t.noContentToPreview }) : <p className="text-gray-400">{t.noContentToPreview}</p>}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || t.enhancedMarkdownPlaceholder}
            className="w-full p-4 border-0 focus:ring-0 focus:outline-none resize-none font-mono text-gray-700 min-h-[200px]"
          />
        )}
      </div>

      {/* Image modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-96">
            <h3 className="text-xl font-bold mb-4">{t.insertImage}</h3>
            <input
              type="url"
              placeholder={t.imageUrlPlaceholder}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={insertImage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t.insert}
              </button>
              <button
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-96">
            <h3 className="text-xl font-bold mb-4">{t.insertVideo}</h3>
            <input
              type="url"
              placeholder={t.videoUrlPlaceholder}
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={insertVideo}
                className="px-4 py-2 bg-tile text-white rounded-lg hover:bg-purple-700"
              >
                {t.insert}
              </button>
              <button
                onClick={() => setShowVideoModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Insert Menu */}
      {showMediaMenu && (
        <MediaInsertMenu
          onInsert={handleMediaInsert}
          onClose={() => setShowMediaMenu(false)}
        />
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-[800px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">📖 {t.instructionsTitle}</h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6 text-gray-700">
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">🎯 {t.basicPrinciples}</h4>
                <ul className="list-disc ml-6 space-y-2">
                  <li><strong>{t.editingMode}:</strong> Пишите текст в текстовом поле</li>
                  <li><strong>{t.previewMode}:</strong> Нажмите кнопку "Предпросмотр" чтобы увидеть результат</li>
                  <li><strong>{t.toolbarButtons}:</strong> Быстро вставляют готовые шаблоны</li>
                  <li><strong>{t.markdownSyntax}:</strong> Используйте специальные символы для форматирования</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">✨ {t.textFormatting}</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold mb-2">{t.boldText}:</p>
                      <code className="block bg-white p-2 rounded border">++жирный текст++</code>
                      <p className="text-sm text-gray-600">{t.result}: <strong>жирный текст</strong></p>
                    </div>
                    <div>
                      <p className="font-bold mb-2">{t.italic}:</p>
                      <code className="block bg-white p-2 rounded border">*курсив*</code>
                      <p className="text-sm text-gray-600">{t.result}: <em>курсив</em></p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">💬 {t.quotes}</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="mb-2"><strong>{t.syntax}:</strong></p>
                  <code className="block bg-white p-2 rounded border">&gt; Это цитата</code>
                  <p className="text-sm text-gray-600 mt-2">💡 <strong>{t.tip}:</strong> {t.useButton} "💬" на панели инструментов</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">📝 {t.headers}</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold mb-2">{t.header1}:</p>
                      <code className="block bg-white p-2 rounded border"># Заголовок</code>
                    </div>
                    <div>
                      <p className="font-bold mb-2">{t.header2}:</p>
                      <code className="block bg-white p-2 rounded border">## Подзаголовок</code>
                    </div>
                    <div>
                      <p className="font-bold mb-2">{t.header3}:</p>
                      <code className="block bg-white p-2 rounded border">### Раздел</code>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">📋 {t.lists}</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold mb-2">{t.unorderedList}:</p>
                      <code className="block bg-white p-2 rounded border">- Первый пункт<br/>- Второй пункт<br/>- Третий пункт</code>
                    </div>
                    <div>
                      <p className="font-bold mb-2">{t.orderedList}:</p>
                      <code className="block bg-white p-2 rounded border">1. Первый пункт<br/>2. Второй пункт<br/>3. Третий пункт</code>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">🔗 {t.linksAndCode}</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold mb-2">{t.link}:</p>
                      <code className="block bg-white p-2 rounded border">[текст ссылки](URL)</code>
                      <p className="text-sm text-gray-600">{t.result}: <a href="#" className="text-blue-600 underline">текст ссылки</a></p>
                    </div>
                    <div>
                      <p className="font-bold mb-2">{t.inlineCode}:</p>
                      <code className="block bg-white p-2 rounded border">`код`</code>
                      <p className="text-sm text-gray-600">{t.result}: <code className="bg-gray-100 px-1 rounded">код</code></p>
                    </div>
                    <div>
                      <p className="font-bold mb-2">{t.codeBlock}:</p>
                      <code className="block bg-white p-2 rounded border">```<br/>код<br/>```</code>
                      <p className="text-sm text-gray-600">{t.result}: блок кода с подсветкой</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">🖼️ {t.media}</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold mb-2">{t.image}:</p>
                      <code className="block bg-white p-2 rounded border">![alt текст](URL изображения)</code>
                      <p className="text-sm text-gray-600">{t.result}: изображение с подписью</p>
                    </div>
                    <div>
                      <p className="font-bold mb-2">{t.video}:</p>
                      <code className="block bg-white p-2 rounded border">[🎥 Video](URL видео)</code>
                      <p className="text-sm text-gray-600">{t.result}: видео с контролами</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">💡 <strong>{t.tip}:</strong> {t.useButton} "🖼️" и "🎥" для быстрой вставки</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">📊 {t.tables}</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="mb-2"><strong>{t.syntax}:</strong></p>
                  <code className="block bg-white p-2 rounded border">| Заголовок 1 | Заголовок 2 |<br/>| --- | --- |<br/>| Ячейка 1 | Ячейка 2 |</code>
                  <p className="text-sm text-gray-600 mt-2">💡 <strong>{t.tip}:</strong> {t.useButton} "📊" для быстрой вставки таблицы</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">💡 {t.usefulTips}</h4>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Всегда используйте пробел после символов форматирования (например, <code># Заголовок</code>, а не <code>#Заголовок</code>)</li>
                  <li>Для многострочных элементов (списки, таблицы) убедитесь, что каждая строка начинается с правильного символа</li>
                  <li>Используйте режим предпросмотра для проверки результата</li>
                  <li>Кнопки панели инструментов автоматически вставляют правильный синтаксис</li>
                  <li>Для вставки медиа из библиотеки используйте кнопку "📁 Медиа"</li>
                  <li>Для создания красивых постов комбинируйте разные элементы форматирования</li>
                  <li>Используйте заголовки для структурирования контента</li>
                  <li>Цитаты отлично подходят для выделения важных мыслей</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">🚀 {t.advancedTechniques}</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-4">
                    <div>
                      <p className="font-bold mb-2">Комбинирование форматирования:</p>
                      <code className="block bg-white p-2 rounded border">&gt; *Это **жирная** цитата с курсивом*</code>
                      <p className="text-sm text-gray-600">Результат: красивая цитата с комбинированным форматированием</p>
                    </div>
                    <div>
                      <p className="font-bold mb-2">Списки с подпунктами:</p>
                      <code className="block bg-white p-2 rounded border">- Главный пункт<br/>  - Подпункт 1<br/>  - Подпункт 2<br/>- Другой главный пункт</code>
                    </div>
                    <div>
                      <p className="font-bold mb-2">Ссылки с описанием:</p>
                      <code className="block bg-white p-2 rounded border">[Описание ссылки](URL "Всплывающая подсказка")</code>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">🔧 {t.problemSolving}</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-3">
                    <div>
                      <p className="font-bold text-red-600">❌ {t.commonMistakes}:</p>
                      <ul className="list-disc ml-6 text-sm">
                        <li>Забыли пробел после # (должно быть <code># Заголовок</code>)</li>
                        <li>Неправильно закрыли теги (например, <code>**жирный*</code> вместо <code>**жирный**</code>)</li>
                        <li>Пропустили пустую строку перед списками</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-bold text-green-600">✅ {t.howToFix}:</p>
                      <ul className="list-disc ml-6 text-sm">
                        <li>Всегда добавляйте пробел после символов форматирования</li>
                        <li>Проверяйте парность символов форматирования</li>
                        <li>Используйте режим предпросмотра для проверки</li>
                        <li>Используйте кнопки панели инструментов</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">📚 {t.readyTemplates}</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-4">
                    <div>
                      <p className="font-bold mb-2">{t.articleTemplate}:</p>
                      <code className="block bg-white p-2 rounded border text-xs">
                        # Название статьи<br/>
                        ## Введение<br/>
                        &gt; Важная цитата или мысль<br/>
                        ## Основная часть<br/>
                        - Пункт 1<br/>
                        - Пункт 2<br/>
                        ## Заключение<br/>
                        **Выводы** и *рекомендации*
                      </code>
                    </div>
                    <div>
                      <p className="font-bold mb-2">{t.instructionTemplate}:</p>
                      <code className="block bg-white p-2 rounded border text-xs">
                        ## Пошаговая инструкция<br/>
                        1. **Первый шаг**<br/>
                        2. *Второй шаг*<br/>
                        3. Третий шаг<br/>
                        &gt; 💡 **Совет:** Важная информация
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">🎨 {t.stylingAndDesign}</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold mb-2">{t.emojiForHeaders}:</p>
                      <code className="block bg-white p-2 rounded border"># 🚀 Быстрый старт</code>
                    </div>
                    <div>
                      <p className="font-bold mb-2">{t.coloredBlocks}:</p>
                      <code className="block bg-white p-2 rounded border">&gt; 💡 **Совет:** Используйте эмодзи</code>
                    </div>
                    <div>
                      <p className="font-bold mb-2">{t.separators}:</p>
                      <code className="block bg-white p-2 rounded border">---</code>
                    </div>
                    <div>
                      <p className="font-bold mb-2">{t.codeWithHighlighting}:</p>
                      <code className="block bg-white p-2 rounded border">```javascript<br/>console.log("Hello");<br/>```</code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                <h4 className="text-lg font-bold text-blue-900 mb-3">🎯 {t.quickStart}</h4>
                <p className="text-blue-800 mb-3">{t.startSimple}:</p>
                <ol className="list-decimal ml-6 text-blue-800 space-y-1">
                  <li>{t.writeHeader} <code className="bg-blue-100 px-1 rounded">#</code></li>
                  <li>{t.addSubheaders} <code className="bg-blue-100 px-1 rounded">##</code></li>
                  <li>{t.highlightImportant} <code className="bg-blue-100 px-1 rounded">++жирным++</code></li>
                  <li>{t.createList} <code className="bg-blue-100 px-1 rounded">-</code></li>
                  <li>{t.addQuote} <code className="bg-blue-100 px-1 rounded">&gt;</code></li>
                  <li>{t.insertImage} <code className="bg-blue-100 px-1 rounded">🖼️</code></li>
                </ol>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                <h4 className="text-lg font-bold text-green-900 mb-3">🚀 {t.practicalExamples}</h4>
                <div className="space-y-4">
                  <div>
                    <p className="font-bold mb-2">{t.postWithQuote}:</p>
                    <div className="bg-white p-3 rounded border text-sm">
                      <p className="mb-2"><code># Мой первый пост</code></p>
                      <p className="mb-2"><code>## Введение</code></p>
                      <p className="mb-2"><code>Это мой первый пост в блоге.</code></p>
                      <p className="mb-2"><code>&gt; **Важная мысль:** Всегда начинайте с простого!</code></p>
                      <p className="mb-2"><code>## Основная часть</code></p>
                      <p className="mb-2"><code>- Пункт первый</code></p>
                      <p className="mb-2"><code>- Пункт второй</code></p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-bold mb-2">{t.exampleWithImage}:</p>
                    <div className="bg-white p-3 rounded border text-sm">
                      <p className="mb-2"><code>## Красивая картинка</code></p>
                      <p className="mb-2"><code>![Описание](https://example.com/image.jpg)</code></p>
                      <p className="mb-2"><code>*Подпись к изображению*</code></p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                <h4 className="text-lg font-bold text-yellow-900 mb-3">⚠️ {t.importantNotes}</h4>
                <ul className="list-disc ml-6 text-yellow-800 space-y-2">
                  <li><strong>{t.spacesImportant}:</strong> {t.alwaysUseSpace}</li>
                  <li><strong>{t.symbolPairing}:</strong> {t.ensureSymbolsMatch}</li>
                  <li><strong>{t.previewMode}:</strong> {t.useForChecking}</li>
                  <li><strong>{t.panelButtons}:</strong> {t.autoInsertSyntax}</li>
                  <li><strong>{t.mediaFiles}:</strong> {t.uploadViaButton}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MCEditor