import { useState } from 'react'

function ColorPicker({ onInsert }) {
  const [showPicker, setShowPicker] = useState(false)
  const [customColor, setCustomColor] = useState('#000000')

  // Предустановленные цвета
  const presetColors = [
    { name: 'Красный', color: '#ef4444', icon: '🔴' },
    { name: 'Оранжевый', color: '#f97316', icon: '🟠' },
    { name: 'Желтый', color: '#eab308', icon: '🟡' },
    { name: 'Зеленый', color: '#22c55e', icon: '🟢' },
    { name: 'Синий', color: '#3b82f6', icon: '🔵' },
    { name: 'Фиолетовый', color: '#a855f7', icon: '🟣' },
    { name: 'Розовый', color: '#ec4899', icon: '🩷' },
    { name: 'Коричневый', color: '#92400e', icon: '🟤' },
  ]

  // Вставка цветного текста
  const insertColoredText = (color) => {
    const template = `<span style="color: ${color}">текст</span>`
    onInsert(template)
    setShowPicker(false)
  }

  // Вставка с фоном
  const insertHighlight = (color) => {
    const template = `<span style="background: ${color}; padding: 2px 4px; border-radius: 3px">текст</span>`
    onInsert(template)
    setShowPicker(false)
  }

  // Вставка кастомного цвета
  const insertCustomColor = () => {
    insertColoredText(customColor)
  }

  return (
    <div className="relative inline-block">
      {/* Кнопка открытия */}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        title="Цветной текст"
      >
        🎨 Цвет
      </button>

      {/* Панель выбора цвета */}
      {showPicker && (
        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 z-50 min-w-[300px]">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Быстрые цвета
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {presetColors.map((preset) => (
                <button
                  key={preset.color}
                  type="button"
                  onClick={() => insertColoredText(preset.color)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={preset.name}
                >
                  <span className="text-2xl">{preset.icon}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Фон (highlight) */}
          <div className="mb-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Фон (Highlight)
            </h4>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => insertHighlight('#fef08a')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Желтый фон"
              >
                <div className="w-full h-6 bg-yellow-200 rounded"></div>
              </button>
              <button
                type="button"
                onClick={() => insertHighlight('#dbeafe')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Синий фон"
              >
                <div className="w-full h-6 bg-blue-100 rounded"></div>
              </button>
              <button
                type="button"
                onClick={() => insertHighlight('#d1fae5')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Зеленый фон"
              >
                <div className="w-full h-6 bg-green-100 rounded"></div>
              </button>
              <button
                type="button"
                onClick={() => insertHighlight('#fce7f3')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Розовый фон"
              >
                <div className="w-full h-6 bg-pink-100 rounded"></div>
              </button>
            </div>
          </div>

          {/* Кастомный цвет */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Свой цвет (HEX/RGB)
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                placeholder="#ff0000 или rgb(255,0,0)"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <button
                type="button"
                onClick={insertCustomColor}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Вставить
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Примеры: #ff0000, rgb(255,0,0), rgba(255,0,0,0.5)
            </p>
          </div>

          {/* Закрыть */}
          <button
            type="button"
            onClick={() => setShowPicker(false)}
            className="w-full mt-3 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
          >
            Закрыть
          </button>
        </div>
      )}
    </div>
  )
}

export default ColorPicker
