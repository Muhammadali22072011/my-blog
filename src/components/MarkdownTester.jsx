import React, { useState } from 'react'
import { renderMarkdown } from '../utils/markdownRenderer'
import { testMarkdownContent, testInlineMarkdown, testComplexMarkdown } from '../utils/testMarkdown'

function MarkdownTester() {
  const [inputText, setInputText] = useState(testMarkdownContent)
  const [selectedTest, setSelectedTest] = useState('full')

  const testCases = {
    full: { name: 'Полный контент', content: testMarkdownContent },
    inline: { name: 'Inline элементы', content: testInlineMarkdown },
    complex: { name: 'Сложные случаи', content: testComplexMarkdown }
  }

  const handleTestChange = (testKey) => {
    setSelectedTest(testKey)
    setInputText(testCases[testKey].content)
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        🧪 Тестирование Markdown Рендерера
      </h1>

      {/* Тестовые случаи */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Выберите тестовый случай:</h2>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(testCases).map(([key, test]) => (
            <button
              key={key}
              onClick={() => handleTestChange(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTest === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {test.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ввод */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">📝 Ввод Markdown</h2>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введите Markdown текст здесь..."
          />
          
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Подсказки:</strong></p>
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li>Используйте <code>++жирный++</code> для жирного текста</li>
              <li>Используйте <code>*курсив*</code> для курсива</li>
              <li>Используйте <code>`код`</code> для inline кода</li>
              <li>Используйте <code># Заголовок</code> для заголовков</li>
              <li>Используйте <code>- пункт</code> для списков</li>
            </ul>
          </div>
        </div>

        {/* Вывод */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">👁️ Результат рендеринга</h2>
          <div className="border border-gray-300 rounded-lg p-4 bg-white min-h-96 overflow-y-auto">
            {inputText ? (
              renderMarkdown(inputText, { emptyText: 'Введите текст для предпросмотра' })
            ) : (
              <p className="text-gray-400">Введите текст для предпросмотра</p>
            )}
          </div>
        </div>
      </div>

      {/* Информация о рендерере */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-blue-900 mb-4">ℹ️ Информация о рендерере</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-blue-800 mb-2">✅ Поддерживаемые элементы:</h3>
            <ul className="text-blue-700 space-y-1 text-sm">
              <li>• Заголовки (H1-H6)</li>
              <li>• Жирный текст (++)</li>
              <li>• Курсив (*)</li>
              <li>• Inline код (`)</li>
              <li>• Блоки кода (```)</li>
              <li>• Списки (-, 1.)</li>
              <li>• Цитаты (>)</li>
              <li>• Ссылки [](</li>
              <li>• Изображения ![]()</li>
              <li>• Видео [🎥 Video]()</li>
              <li>• Таблицы | | |</li>
              <li>• HTML элементы</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-blue-800 mb-2">🔧 Технические особенности:</h3>
            <ul className="text-blue-700 space-y-1 text-sm">
              <li>• Универсальный рендерер</li>
              <li>• Оптимизированная производительность</li>
              <li>• Защита от XSS атак</li>
              <li>• Адаптивный дизайн</li>
              <li>• Поддержка всех браузеров</li>
              <li>• Легкая интеграция</li>
              <li>• Настраиваемые опции</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Быстрые тесты */}
      <div className="mt-8 bg-green-50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-green-900 mb-4">🚀 Быстрые тесты</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setInputText('# Тест заголовка\n\nЭто **тестовый** текст с *курсивом* и `кодом`.')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Тест заголовков
          </button>
          <button
            onClick={() => setInputText('- Первый пункт\n- Второй пункт\n- Третий пункт\n\n1. Нумерованный 1\n2. Нумерованный 2')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Тест списков
          </button>
          <button
            onClick={() => setInputText('> Это **важная** цитата\n> с *курсивом* и `кодом`')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Тест цитат
          </button>
        </div>
      </div>
    </div>
  )
}

export default MarkdownTester
