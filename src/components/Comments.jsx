import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../config/supabase'

const MAX_DEPTH = 4
const MAX_LENGTH = 2000

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Один комментарий.
 *
 * Компонент вынесен НАРУЖУ. Раньше он объявлялся внутри Comments, из-за чего
 * при каждом рендере React видел новый тип компонента и размонтировал всё
 * дерево комментариев — на каждое нажатие клавиши в поле ввода.
 */
function CommentItem({ comment, depth = 0, onReply }) {
  const name = comment.author_name?.trim() || 'Аноним'

  return (
    <div className={depth > 0 ? 'rule-l ml-5 pl-5' : ''}>
      <article className="py-4">
        <div className="flex items-baseline gap-3">
          <span className="font-medium text-ink">{name}</span>
          <span className="label">{formatDate(comment.created_at)}</span>
        </div>
        <p className="mt-2 whitespace-pre-line leading-relaxed text-ink/85">{comment.content}</p>
        {depth < MAX_DEPTH && (
          <button onClick={() => onReply(comment.id)} className="label mt-2 hover:text-tile">
            Ответить
          </button>
        )}
      </article>

      {comment.replies?.map((reply) => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} onReply={onReply} />
      ))}
    </div>
  )
}

/** Плоский список → дерево ответов, с защитой от циклических parent_id */
function buildCommentTree(comments) {
  const map = new Map()
  const roots = []

  for (const c of comments) map.set(c.id, { ...c, replies: [] })

  for (const c of comments) {
    const node = map.get(c.id)
    const parent = c.parent_id ? map.get(c.parent_id) : null
    if (parent && parent !== node) parent.replies.push(node)
    else roots.push(node)
  }

  return roots
}

function Comments({ postId }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [error, setError] = useState(null)

  const loadComments = useCallback(async () => {
    if (!postId) return
    try {
      const { data, error: loadError } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (loadError) throw loadError
      setComments(data || [])
    } catch (err) {
      console.error('Ошибка загрузки комментариев:', err)
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    loadComments()

    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        loadComments
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId, loadComments])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const name = authorName.trim()
    const content = newComment.trim()

    // Валидация на клиенте — удобство, а не защита.
    // Ограничения обязаны дублироваться политиками RLS и CHECK в Supabase.
    if (!name || !content) return
    if (content.length > MAX_LENGTH) {
      setError(`Комментарий длиннее ${MAX_LENGTH} символов`)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const { error: insertError } = await supabase.from('comments').insert([
        {
          post_id: postId,
          author_name: name.slice(0, 80),
          content,
          parent_id: replyTo,
        },
      ])

      if (insertError) throw insertError

      setNewComment('')
      setReplyTo(null)
      await loadComments()
    } catch (err) {
      console.error('Ошибка отправки комментария:', err)
      setError('Не удалось отправить комментарий. Попробуйте позже.')
    } finally {
      setSubmitting(false)
    }
  }

  const commentTree = useMemo(() => buildCommentTree(comments), [comments])

  return (
    <section className="rule-t pt-10">
      <h2 className="display text-3xl">
        Обсуждение <span className="folio align-super text-base">{comments.length}</span>
      </h2>

      <form onSubmit={handleSubmit} className="mt-8 max-w-measure">
        {replyTo && (
          <div className="mb-4 flex items-center gap-4">
            <span className="label label-tile">Ответ на комментарий</span>
            <button type="button" onClick={() => setReplyTo(null)} className="label hover:text-terra">
              Отменить
            </button>
          </div>
        )}

        <label htmlFor="comment-author" className="label">
          Имя
        </label>
        <input
          id="comment-author"
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          maxLength={80}
          required
          className="mt-1 w-full border-0 border-b border-ink/25 bg-transparent px-0 py-2 outline-none transition-colors focus:border-tile"
        />

        <label htmlFor="comment-body" className="label mt-6 block">
          Комментарий
        </label>
        <textarea
          id="comment-body"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={4}
          maxLength={MAX_LENGTH}
          required
          className="mt-1 w-full resize-none border border-ink/20 bg-transparent p-3 outline-none transition-colors focus:border-tile"
        />

        <div className="mt-4 flex items-center gap-5">
          <button
            type="submit"
            disabled={submitting || !newComment.trim() || !authorName.trim()}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? 'Отправка…' : 'Отправить'}
          </button>
          <span className="folio">
            {newComment.length}/{MAX_LENGTH}
          </span>
        </div>

        {error && <p className="label mt-3 text-terra">{error}</p>}
      </form>

      <div className="mt-10">
        {loading ? (
          <div className="space-y-3">
            <div className="skeleton h-4 w-1/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-2/3" />
          </div>
        ) : commentTree.length > 0 ? (
          <div className="divide-y divide-ink/10">
            {commentTree.map((comment) => (
              <CommentItem key={comment.id} comment={comment} onReply={setReplyTo} />
            ))}
          </div>
        ) : (
          <p className="text-ink-soft">Пока никто не высказался. Будьте первым.</p>
        )}
      </div>
    </section>
  )
}

export default Comments
