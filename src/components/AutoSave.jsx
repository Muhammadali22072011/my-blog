import { useState, useEffect, useCallback } from 'react'

function AutoSave({ content, onSave, interval = 30000 }) {
  const [lastSaved, setLastSaved] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Track changes
  useEffect(() => {
    setHasChanges(true)
  }, [content])

  // Auto-save logic
  const performSave = useCallback(async () => {
    if (!hasChanges || !content?.trim()) return
    
    setIsSaving(true)
    try {
      await onSave(content)
      setLastSaved(new Date())
      setHasChanges(false)
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }, [content, hasChanges, onSave])

  // Set up interval
  useEffect(() => {
    const timer = setInterval(performSave, interval)
    return () => clearInterval(timer)
  }, [performSave, interval])

  // Save on unmount
  useEffect(() => {
    return () => {
      if (hasChanges && content?.trim()) {
        // Save to localStorage as backup
        localStorage.setItem('draft_backup', JSON.stringify({
          content,
          savedAt: new Date().toISOString()
        }))
      }
    }
  }, [content, hasChanges])

  const formatTime = (date) => {
    if (!date) return ''
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {isSaving ? (
        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Saving...
        </span>
      ) : lastSaved ? (
        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Saved at {formatTime(lastSaved)}
        </span>
      ) : hasChanges ? (
        <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Unsaved changes
        </span>
      ) : null}
    </div>
  )
}

// Hook for draft recovery
export function useDraftRecovery() {
  const [recoveredDraft, setRecoveredDraft] = useState(null)

  useEffect(() => {
    const backup = localStorage.getItem('draft_backup')
    if (backup) {
      try {
        const parsed = JSON.parse(backup)
        const savedAt = new Date(parsed.savedAt)
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
        
        // Only recover if saved within last hour
        if (savedAt > hourAgo) {
          setRecoveredDraft(parsed)
        } else {
          localStorage.removeItem('draft_backup')
        }
      } catch (e) {
        localStorage.removeItem('draft_backup')
      }
    }
  }, [])

  const clearRecoveredDraft = () => {
    localStorage.removeItem('draft_backup')
    setRecoveredDraft(null)
  }

  return { recoveredDraft, clearRecoveredDraft }
}

export default AutoSave
