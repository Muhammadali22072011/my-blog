import { useState } from 'react'
import Admin from '../pages/Admin'
import MultiStepAuth from './MultiStepAuth'
import AdminGate from './admin/AdminGate'

// Два шага: головоломка прячет форму входа от случайных посетителей,
// а настоящий доступ даёт только сессия Supabase с правами админа (AdminGate)
function ProtectedAdmin() {
  const [authUnlocked, setAuthUnlocked] = useState(() => {
    const token = localStorage.getItem('multi_auth_token')
    if (token) {
      try {
        const { expires } = JSON.parse(token)
        if (Date.now() < expires) {
          return true
        } else {
          localStorage.removeItem('multi_auth_token')
        }
      } catch {
        localStorage.removeItem('multi_auth_token')
      }
    }
    return false
  })

  if (authUnlocked) {
    return (
      <AdminGate>
        <Admin />
      </AdminGate>
    )
  }

  return <MultiStepAuth onSuccess={() => setAuthUnlocked(true)} />
}

export default ProtectedAdmin
