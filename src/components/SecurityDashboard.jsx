import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import toast from 'react-hot-toast'

function SecurityDashboard() {
  const [securityLogs, setSecurityLogs] = useState([])
  const [stats, setStats] = useState({
    totalAttempts: 0,
    blockedIPs: 0,
    suspiciousActivity: 0,
    lastAttack: null
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadSecurityData()
  }, [])

  const loadSecurityData = async () => {
    try {
      setLoading(true)

      // Загружаем логи безопасности
      const { data: logs, error } = await supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setSecurityLogs(logs || [])

      // Подсчитываем статистику
      const blocked = logs?.filter(log => log.action === 'blocked').length || 0
      const suspicious = logs?.filter(log => log.severity === 'high').length || 0
      const lastAttack = logs?.find(log => log.action === 'blocked')

      setStats({
        totalAttempts: logs?.length || 0,
        blockedIPs: new Set(logs?.filter(l => l.action === 'blocked').map(l => l.ip_address)).size,
        suspiciousActivity: suspicious,
        lastAttack: lastAttack?.created_at
      })
    } catch (error) {
      console.error('Error loading security data:', error)
      toast.error('Ошибка загрузки данных безопасности')
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = async () => {
    if (!window.confirm('Удалить все логи безопасности?')) return

    try {
      const { error } = await supabase
        .from('security_logs')
        .delete()
        .neq('id', 0) // Удаляем все

      if (error) throw error

      toast.success('Логи очищены')
      loadSecurityData()
    } catch (error) {
      console.error('Error clearing logs:', error)
      toast.error('Ошибка очистки логов')
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/30'
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30'
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
      case 'low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30'
    }
  }

  const getActionIcon = (action) => {
    switch (action) {
      case 'blocked':
        return '🚫'
      case 'warning':
        return '⚠️'
      case 'allowed':
        return '✅'
      default:
        return '📝'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            🛡️ Кибербезопасность
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Мониторинг и защита системы</p>
        </div>
        <button
          onClick={loadSecurityData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Обновить
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-paper-deep rounded p-6 text-white">
          <div className="text-3xl font-bold">{stats.totalAttempts}</div>
          <div className="text-blue-100 text-sm mt-1">Всего событий</div>
        </div>
        <div className="bg-saffron rounded p-6 text-white">
          <div className="text-3xl font-bold">{stats.blockedIPs}</div>
          <div className="text-red-100 text-sm mt-1">Заблокировано IP</div>
        </div>
        <div className="bg-saffron rounded p-6 text-white">
          <div className="text-3xl font-bold">{stats.suspiciousActivity}</div>
          <div className="text-orange-100 text-sm mt-1">Подозрительная активность</div>
        </div>
        <div className="bg-tile rounded p-6 text-white">
          <div className="text-3xl font-bold">
            {stats.lastAttack ? new Date(stats.lastAttack).toLocaleDateString() : 'Нет'}
          </div>
          <div className="text-green-100 text-sm mt-1">Последняя атака</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'overview'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          📊 Обзор
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'logs'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          📝 Логи
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          ⚙️ Настройки
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Последние события
            </h3>
            <div className="space-y-2">
              {securityLogs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getActionIcon(log.action)}</span>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-white">
                        {log.event_type}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {log.ip_address} • {log.user_agent?.substring(0, 50)}...
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                      {log.severity}
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Все логи безопасности
            </h3>
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-terra text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              🗑️ Очистить логи
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Время
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Событие
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      IP Адрес
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Действие
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Уровень
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {securityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                        {log.event_type}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {log.ip_address}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="flex items-center gap-1">
                          {getActionIcon(log.action)} {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                          {log.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Настройки безопасности
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <div className="font-medium text-gray-800 dark:text-white">
                    Защита от брутфорса
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Блокировка после 5 неудачных попыток
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <div className="font-medium text-gray-800 dark:text-white">
                    Двухфакторная аутентификация
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Дополнительная защита входа
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <div className="font-medium text-gray-800 dark:text-white">
                    Логирование всех действий
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Запись всех событий в систему
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 dark:text-saffron mb-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Рекомендации
            </h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Регулярно проверяйте логи безопасности</li>
              <li>• Используйте сильные пароли</li>
              <li>• Включите двухфакторную аутентификацию</li>
              <li>• Обновляйте систему регулярно</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default SecurityDashboard
