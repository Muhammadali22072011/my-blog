/**
 * Настоящая защита админки: вход через Supabase Auth + проверка is_admin().
 * Головоломка перед ней — только ширма; права на запись даёт база (RLS),
 * а она смотрит именно на эту сессию.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../config/supabase'
import { getAdminStatus } from '../../services/videoService'
import AdminLogin from './AdminLogin'

function GateShell({ children }) {
  return (
    <div className="min-h-[70vh] bg-paper px-4 py-12 text-ink">
      <div className="mx-auto w-full max-w-sm">{children}</div>
    </div>
  )
}

function AdminGate({ children }) {
  // checking | anon | not-admin | error | admin
  const [state, setState] = useState('checking')
  const [email, setEmail] = useState('')
  const [signingOut, setSigningOut] = useState(false)
  const seqRef = useRef(0)
  const aliveRef = useRef(false)
  const userIdRef = useRef(null)

  const check = useCallback(async (session) => {
    const seq = ++seqRef.current
    if (!session?.user) {
      userIdRef.current = null
      setEmail('')
      setState('anon')
      return
    }
    userIdRef.current = session.user.id
    setEmail(session.user.email || '')
    // Уже впущенного админа не прячем за скелетон — иначе форма потеряет ввод
    setState((prev) => (prev === 'admin' ? prev : 'checking'))
    const status = await getAdminStatus()
    if (!aliveRef.current || seq !== seqRef.current) return
    // Сбой сети при повторной проверке не выкидывает админа из открытой формы
    setState((prev) => (prev === 'admin' && status === 'error' ? prev : status))
  }, [])

  useEffect(() => {
    aliveRef.current = true
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Обновление токена того же пользователя права не меняет
      if (event === 'TOKEN_REFRESHED' && session?.user?.id === userIdRef.current) return
      // Внутри колбэка нельзя ждать другие вызовы supabase (взаимная блокировка) — откладываем
      setTimeout(() => {
        if (aliveRef.current) check(session)
      }, 0)
    })
    return () => {
      aliveRef.current = false
      subscription.unsubscribe()
    }
  }, [check])

  const retry = async () => {
    const { data } = await supabase.auth.getSession()
    if (aliveRef.current) check(data?.session)
  }

  const signOut = async () => {
    setSigningOut(true)
    try {
      await supabase.auth.signOut()
    } finally {
      if (aliveRef.current) setSigningOut(false)
    }
  }

  if (state === 'admin') return children

  if (state === 'checking') {
    return (
      <GateShell>
        <div className="space-y-3" aria-busy="true" aria-label="Проверяем доступ">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-11 w-32" />
        </div>
      </GateShell>
    )
  }

  if (state === 'anon') {
    return (
      <GateShell>
        <AdminLogin />
      </GateShell>
    )
  }

  return (
    <GateShell>
      <p className="label label-tile mb-3">Админка</p>
      <h1 className="display mb-4 text-3xl">
        {state === 'error' ? 'Не удалось проверить права' : 'Этот аккаунт не админ'}
      </h1>
      <p className="mb-6 text-ink-soft">
        {state === 'error' ? (
          'Нет связи с базой. Проверьте интернет и попробуйте ещё раз.'
        ) : (
          <>
            Вы вошли как <span className="font-mono text-ink">{email || 'без почты'}</span>, но у этого
            аккаунта нет прав на управление сайтом.
          </>
        )}
      </p>
      <div className="flex flex-wrap gap-3">
        {state === 'error' && (
          <button type="button" className="btn-primary" onClick={retry}>
            Повторить
          </button>
        )}
        <button type="button" className="btn-secondary" onClick={signOut} disabled={signingOut}>
          {signingOut ? 'Выходим…' : 'Выйти'}
        </button>
      </div>
    </GateShell>
  )
}

export default AdminGate
