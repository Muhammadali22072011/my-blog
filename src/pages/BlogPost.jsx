import { useParams, Link } from 'react-router-dom'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useData } from '../context/DataContext'
import { supabase } from '../config/supabase'
import { renderMarkdown } from '../utils/markdownRenderer.jsx'
import TableOfContents from '../components/TableOfContents'
import Reactions from '../components/Reactions'
import Comments from '../components/Comments'
import { BookmarkButton } from '../components/Bookmarks'
import ViewCounter from '../components/ViewCounter'
import SEOHead from '../components/SEOHead'
import SEOKeywords from '../components/SEOKeywords'
import { extractKeywords } from '../utils/seoKeywordExtractor'
import ExportPost from '../components/ExportPost'
import QuoteShare from '../components/QuoteShare'
import PostRating from '../components/PostRating'
import SocialShare from '../components/SocialShare'
import PostStats from '../components/PostStats'
import RelatedPostsWidget from '../components/RelatedPostsWidget'
import {
  getPostTitle,
  getExcerpt,
  getReadingTime,
  getPostCover,
  stripLeadingTitle,
  formatDateRu,
} from '../utils/postFormat'

/**
 * Полоса материала: широкое поле для чтения, узкая колонка полей справа.
 * Ширина текста ограничена мерой строки (~66 знаков) — это читаемость,
 * а не декоративное ограничение.
 */
function BlogPost() {
  const { id } = useParams()
  const { posts } = useData()

  const [post, setPost] = useState(null)
  const [postLoading, setPostLoading] = useState(true)
  const [postError, setPostError] = useState(null)
  const [readingProgress, setReadingProgress] = useState(0)
  const [showBackToTop, setShowBackToTop] = useState(false)

  // Прогресс чтения. Слушатель пассивный и сглажен через rAF —
  // раньше setState вызывался на каждое событие прокрутки.
  useEffect(() => {
    let frame = null

    const handleScroll = () => {
      if (frame !== null) return
      frame = requestAnimationFrame(() => {
        frame = null
        const scrollTop = window.scrollY
        const docHeight = document.documentElement.scrollHeight - window.innerHeight
        setReadingProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0)
        setShowBackToTop(scrollTop > 600)
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    // Строгая проверка: parseInt('12abc') раньше молча открывал пост №12
    const parsedId = /^\d+$/.test(String(id ?? '')) ? Number(id) : null

    if (parsedId === null) {
      setPost(null)
      setPostError('Неверный адрес материала')
      setPostLoading(false)
      return
    }

    let cancelled = false
    setPost(null)
    setPostError(null)
    setPostLoading(true)
    window.scrollTo({ top: 0, behavior: 'auto' })

    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', parsedId)
          .maybeSingle()

        if (cancelled) return

        if (error) setPostError(error.message)
        else if (!data) setPostError('Материал не найден')
        else if (data.status !== 'published') setPostError('Материал не опубликован')
        else setPost(data)
      } catch (err) {
        if (!cancelled) setPostError(err.message)
      } finally {
        if (!cancelled) setPostLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id])

  const postTitle = useMemo(() => (post ? getPostTitle(post) : ''), [post])
  const cleanContent = useMemo(() => stripLeadingTitle(post?.content), [post])
  const cover = useMemo(() => (post ? getPostCover(post) : null), [post])
  const description = useMemo(() => getExcerpt(post?.content), [post])
  const keywords = useMemo(() => (post ? extractKeywords(post.content, 15) : []), [post])

  // Стабильная ссылка: раньше новый массив на каждый рендер заставлял
  // эффект в SEOHead перезаписывать мета-теги бесконечно.
  const seoTags = useMemo(
    () => (post?.tags?.length ? post.tags : [post?.category].filter(Boolean)),
    [post]
  )

  const { prev: prevPost, next: nextPost } = useMemo(() => {
    if (!post || !posts?.length) return { prev: null, next: null }
    const published = [...posts]
      .filter((p) => p.status === 'published')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    const i = published.findIndex((p) => p.id === post.id)
    if (i === -1) return { prev: null, next: null }
    return {
      prev: i < published.length - 1 ? published[i + 1] : null,
      next: i > 0 ? published[i - 1] : null,
    }
  }, [post, posts])

  const scrollTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  if (postLoading) {
    return (
      <div className="mx-auto max-w-6xl px-5 pt-20 sm:px-8">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton mt-8 h-16 w-4/5" />
        <div className="skeleton mt-4 h-16 w-3/5" />
        <div className="skeleton mt-10 h-64 w-full" />
        <div className="mt-10 max-w-measure space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-4" style={{ width: `${95 - i * 6}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (postError || !post) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-32 text-center sm:px-8">
        <p className="label text-terra">Ошибка</p>
        <h1 className="display mt-4 text-4xl">{postError || 'Материал не найден'}</h1>
        <Link to="/blogs" className="btn-primary mt-8">
          Вернуться к указателю
        </Link>
      </div>
    )
  }

  return (
    <div>
      <SEOHead
        title={postTitle}
        description={description}
        image={cover}
        url={window.location.href}
        type="article"
        publishedTime={post.created_at}
        modifiedTime={post.updated_at}
        tags={seoTags}
      />

      <SEOKeywords
        keywords={keywords}
        post={{
          title: postTitle,
          description,
          content: post.content,
          image: cover,
          publishedTime: post.created_at,
          modifiedTime: post.updated_at,
          category: post.category,
          author: 'Muhammadali Izzatullaev',
        }}
        type="article"
      />

      <QuoteShare />

      {/* Полоса прогресса чтения — в цвете изразца */}
      <div
        className="fixed left-0 top-0 z-50 h-[3px] bg-tile transition-[width] duration-150"
        style={{ width: `${readingProgress}%` }}
        role="progressbar"
        aria-label="Прогресс чтения"
        aria-valuenow={Math.round(readingProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {/* ── Титул материала ───────────────────────────────────── */}
        <header className="pb-12 pt-14 sm:pt-20">
          <div className="mb-10 flex items-center justify-between gap-4">
            <Link to="/blogs" className="label link-wipe hover:text-tile">
              ← Указатель
            </Link>
            <div className="flex items-center gap-3">
              <ExportPost post={post} title={postTitle} />
              <BookmarkButton postId={post.id} postTitle={postTitle} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="label">{formatDateRu(post.created_at)}</span>
            <span className="label">{getReadingTime(post.content)} мин чтения</span>
            <ViewCounter postId={post.id} />
            {post.category && <span className="label label-tile">{post.category}</span>}
          </div>

          <h1 className="display mt-6 max-w-4xl text-[clamp(2.25rem,6.5vw,4.5rem)]">
            {postTitle}
          </h1>

          {cover && (
            <figure className="mt-12">
              <div className="relative">
                <div
                  className="absolute inset-0 translate-x-3 translate-y-3 bg-tile"
                  aria-hidden="true"
                />
                <img
                  src={cover}
                  alt={postTitle}
                  className="relative max-h-[560px] w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.parentElement.style.display = 'none'
                  }}
                />
              </div>
            </figure>
          )}
        </header>

        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12">
          {/* ── Текст ───────────────────────────────────────────── */}
          <div className="lg:col-span-8">
            <article className="article-body">
              {cleanContent
                ? renderMarkdown(cleanContent, { emptyText: 'Материал пока пуст' })
                : null}
            </article>

            <div className="ornament my-14">
              <span className="label label-tile">◆</span>
            </div>

            <PostStats postId={post.id} />

            <div className="rule-t rule-b my-10 py-8">
              <Reactions postId={post.id} />
            </div>

            <PostRating postId={post.id} />

            <div className="mt-10">
              <SocialShare url={window.location.href} title={postTitle} description={description} />
            </div>

            {/* ── Соседние материалы ────────────────────────────── */}
            {(prevPost || nextPost) && (
              <nav className="rule-t mt-16 grid grid-cols-1 gap-px pt-10 sm:grid-cols-2" aria-label="Соседние материалы">
                {prevPost ? (
                  <Link to={`/post/${prevPost.id}`} className="group py-5 pr-6">
                    <span className="label transition-colors group-hover:text-tile">
                      ← Предыдущий
                    </span>
                    <p className="display mt-2 text-xl leading-tight transition-colors group-hover:text-tile">
                      {getPostTitle(prevPost, 60)}
                    </p>
                  </Link>
                ) : (
                  <span />
                )}

                {nextPost && (
                  <Link
                    to={`/post/${nextPost.id}`}
                    className="group rule-l py-5 pl-6 text-right sm:text-right"
                  >
                    <span className="label transition-colors group-hover:text-tile">
                      Следующий →
                    </span>
                    <p className="display mt-2 text-xl leading-tight transition-colors group-hover:text-tile">
                      {getPostTitle(nextPost, 60)}
                    </p>
                  </Link>
                )}
              </nav>
            )}

            <div className="mt-16">
              <Comments postId={post.id} />
            </div>
          </div>

          {/* ── Поля страницы ───────────────────────────────────── */}
          <aside className="lg:col-span-4">
            <div className="sticky top-28 space-y-10">
              <TableOfContents content={post.content} />
              <RelatedPostsWidget
                currentPostId={post.id}
                category={post.category}
                tags={post.tags || []}
              />
            </div>
          </aside>
        </div>
      </div>

      {/* Возврат наверх */}
      <button
        onClick={scrollTop}
        aria-label="Наверх"
        className={`label fixed bottom-8 right-8 z-40 border border-ink/25 bg-paper px-3 py-2 transition-all duration-300 hover:border-tile hover:text-tile ${
          showBackToTop ? 'opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        ↑ Наверх
      </button>
    </div>
  )
}

export default BlogPost
