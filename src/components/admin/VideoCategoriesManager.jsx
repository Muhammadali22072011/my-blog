/**
 * Категории видео: добавить, переименовать, сменить порядок, удалить.
 * Адрес (slug) задаётся один раз при создании и при переименовании не
 * меняется — чтобы не ломать уже разосланные ссылки на категорию.
 */
import { useEffect, useRef, useState } from 'react'
import { deleteCategory, saveCategory } from '../../services/videoService'
import { slugify } from '../../utils/videoFormat'

const INPUT =
  'w-full border border-ink/25 bg-paper px-3 py-2.5 text-base text-ink focus:border-tile focus:outline-none'

const dbErrorText = (err) => {
  const m = String(err?.message || '')
  if (/duplicate key|unique/i.test(m)) return 'Такая категория уже есть'
  if (/row-level security|permission denied/i.test(m)) return 'Нет прав — войдите как админ'
  return m || 'Не удалось сохранить'
}

function uniqueSlug(base, categories) {
  const taken = new Set(categories.map((c) => c.slug))
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

function CategoryRow({ category, categories, onSaved, onDeleted }) {
  const [name, setName] = useState(category.name)
  const [order, setOrder] = useState(String(category.order_index ?? 0))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const aliveRef = useRef(false)
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
    }
  }, [])

  const dirty = name.trim() !== category.name || Number(order) !== Number(category.order_index ?? 0)

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) return setError('Название не может быть пустым')
    const lower = trimmed.toLowerCase()
    if (categories.some((c) => c.id !== category.id && c.name.toLowerCase() === lower)) {
      return setError('Такая категория уже есть')
    }
    setBusy(true)
    setError('')
    try {
      await saveCategory({
        id: category.id,
        name: trimmed,
        slug: category.slug,
        order_index: Number.parseInt(order, 10) || 0,
      })
      await onSaved()
    } catch (err) {
      if (aliveRef.current) setError(dbErrorText(err))
    } finally {
      if (aliveRef.current) setBusy(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(`Удалить категорию «${category.name}»? Видео из неё останутся, но без категории.`)) return
    setBusy(true)
    setError('')
    try {
      await deleteCategory(category.id)
      await onDeleted(category.id)
    } catch (err) {
      if (aliveRef.current) {
        setError(dbErrorText(err))
        setBusy(false)
      }
    }
  }

  return (
    <li className="rule-b py-3">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <input
            aria-label="Название категории"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={INPUT}
            disabled={busy}
          />
        </div>
        <div className="w-16 shrink-0">
          <input
            aria-label="Порядок"
            type="number"
            inputMode="numeric"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className={`${INPUT} numeric px-2 text-center`}
            disabled={busy}
          />
        </div>
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3">
        <span className="folio">/{category.slug}</span>
        <div className="flex">
          {dirty && (
            <button type="button" className="btn-ghost text-tile" onClick={save} disabled={busy}>
              Сохранить
            </button>
          )}
          <button type="button" className="btn-ghost hover:!text-terra" onClick={remove} disabled={busy}>
            Удалить
          </button>
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-terra">{error}</p>}
    </li>
  )
}

function VideoCategoriesManager({ categories, onChange, onDeleted }) {
  const [name, setName] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const aliveRef = useRef(false)
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
    }
  }, [])

  const add = async (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Такая категория уже есть')
      return
    }
    const base = slugify(trimmed)
    if (!base) {
      setError('Из названия не получается адрес — добавьте буквы или цифры')
      return
    }
    setAdding(true)
    setError('')
    try {
      const maxOrder = categories.reduce((m, c) => Math.max(m, Number(c.order_index) || 0), 0)
      await saveCategory({
        name: trimmed,
        slug: uniqueSlug(base, categories),
        order_index: categories.length ? maxOrder + 1 : 0,
      })
      if (aliveRef.current) setName('')
      await onChange()
    } catch (err) {
      if (aliveRef.current) setError(dbErrorText(err))
    } finally {
      if (aliveRef.current) setAdding(false)
    }
  }

  const handleDeleted = async (id) => {
    onDeleted?.(id)
    await onChange()
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="label">Категории · {categories.length}</p>
        <p className="folio">порядок</p>
      </div>

      {categories.length === 0 ? (
        <p className="rule-t py-3 text-sm text-ink-soft">Категорий пока нет.</p>
      ) : (
        <ul className="rule-t">
          {categories.map((c) => (
            // key с данными: после сохранения строка сбрасывает черновик
            <CategoryRow
              key={`${c.id}:${c.name}:${c.order_index}`}
              category={c}
              categories={categories}
              onSaved={onChange}
              onDeleted={handleDeleted}
            />
          ))}
        </ul>
      )}

      <form onSubmit={add} className="mt-4 flex gap-2">
        <input
          aria-label="Новая категория"
          placeholder="Новая категория"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={INPUT}
          disabled={adding}
        />
        <button type="submit" className="btn-secondary shrink-0 px-4" disabled={adding || !name.trim()}>
          {adding ? '…' : 'Добавить'}
        </button>
      </form>
      {error && <p className="mt-1 text-sm text-terra">{error}</p>}
    </div>
  )
}

export default VideoCategoriesManager
