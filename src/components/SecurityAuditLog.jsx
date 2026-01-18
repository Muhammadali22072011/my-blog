import { useState, useEffect } from 'react'
import { supabase } from '../services/SupabaseService'

function SecurityAuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, login, page_view, admin_access
  const [searchIP, setSearchIP] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [filter])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (filter !== 'all') {
        query = query.eq('event_type', filter)
      }

      if (searchIP) {
        query = query.ilike('ip_address', `%${searchIP}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error fetching security logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'login':
        return '🔐'
      case 'logout':
        return '🚪'
      case 'page_view':
        return '👁️'
      case 'admin_access':
        return '⚠️'
      default:
        return '📝'
    }
  }

  const getEventColor = (eventType) => {
    switch (eventType) {
      case 'login':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'logout':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      case 'page_view':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'admin_access':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getBrowserIcon = (browser) => {
    if (!browser) return '🌐'
    const b = browser.toLowerCase()
    if (b.includes('chrome')) return '🔵'
    if (b.includes('firefox')) return '🦊'
    if (b.includes('safari')) return '🧭'
    if (b.includes('edge')) return '🔷'
    if (b.includes('opera')) return '🔴'
    return '🌐'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          🔒 Логи безопасности
        </h2>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Обновить
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Event type filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Тип события
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <option value="all">Все события</option>
              <option value="login">🔐 Входы</option>
              <option value="logout">🚪 Выходы</option>
              <option value="page_view">👁️ Просмотры страниц</option>
              <option value="admin_access">⚠️ Доступ к админке</option>
            </select>
          </div>

          {/* IP search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Поиск по IP
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchIP}
                onChange={(e) => setSearchIP(e.target.value)}
                placeholder="192.168.1.1"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
              <button
                onClick={fetchLogs}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                🔍
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {logs.filter(l => l.event_type === 'login').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Входов</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {logs.filter(l => l.event_type === 'page_view').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Просмотров</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {logs.filter(l => l.event_type === 'admin_access').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Админ доступов</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {new Set(logs.map(l => l.ip_address)).size}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Уникальных IP</div>
        </div>
      </div>

      {/* Logs table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Загрузка...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Логов пока нет</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Событие
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Время
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    IP адрес
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Браузер
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Местоположение
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Страница
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getEventColor(log.event_type)}`}>
                        {getEventIcon(log.event_type)} {log.event_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-800 dark:text-gray-200">
                      {log.ip_address || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        {getBrowserIcon(log.browser)}
                        <span>{log.browser || 'Unknown'}</span>
                      </div>
                      {log.os && <div className="text-xs text-gray-500">{log.os}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {log.city && log.country ? (
                        <div>
                          <div>🌍 {log.city}, {log.country}</div>
                          {log.latitude && log.longitude && (
                            <div className="text-xs text-gray-500">
                              📍 {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}
                            </div>
                          )}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {log.page_url ? (
                        <div className="max-w-xs truncate" title={log.page_url}>
                          {log.page_title || log.page_url}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default SecurityAuditLog
