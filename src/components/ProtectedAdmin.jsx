import { useState } from 'react'
import Admin from '../pages/Admin'
import MultiStepAuth from './MultiStepAuth'

function ProtectedAdmin() {
  const [authUnlocked, setAuthUnlocked] = useState(() => {
    // Check if already unlocked
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

  // If unlocked, show admin panel
  if (authUnlocked) {
    return <Admin />
  }

  // Show multi-step authentication
  return <MultiStepAuth onSuccess={() => setAuthUnlocked(true)} />
}

export default ProtectedAdmin
