import React from 'react'
import CustomVideoPlayer from '../components/CustomVideoPlayer'
import { getFullImageUrl } from './postFormat'

/**
 * Рендерер Markdown → React.
 *
 * Что здесь исправлено по сравнению с прежней версией:
 *
 *  1. Работает стандартный `**жирный**`. Раньше поддерживался только
 *     нестандартный `++жирный++`, а регулярка курсива `\*(.*?)\*`
 *     разрывала `**` пополам и калечила текст.
 *  2. Инлайновые элементы разбираются ОДНИМ проходом слева направо.
 *     Раньше каждый вид собирался своей регуляркой в общий список,
 *     диапазоны накладывались, и `text.substring(lastIndex, start)`
 *     при start < lastIndex молча дублировал куски текста.
 *  3. Таблица распознаётся только при наличии строки-разделителя.
 *     Раньше любой абзац с символом `|` (например `a || b`) превращался
 *     в таблицу.
 *  4. Убрана «автоматическая расстановка переносов»: текст длиннее 100
 *     символов резался по каждой точке с пробелом, ломая ссылки,
 *     сокращения и числа.
 *  5. Убраны console.log на каждый инлайновый вызов — на длинном посте
 *     это тысячи записей в консоль.
 *  6. Цвета берутся из токенов темы, поэтому текст читаем в тёмной теме.
 */

/* ──────────────────────────────────────────────────────────────
   Инлайновая разметка
   ────────────────────────────────────────────────────────────── */

// Порядок важен: сначала то, что не должно разбираться внутри (код, span),
// затем изображения и ссылки, затем начертания.
const INLINE_PATTERN = new RegExp(
  [
    /(?<code>`[^`\n]+`)/.source,
    /(?<span><span\s+style="(?<spanStyle>[^"]*)"\s*>(?<spanText>[\s\S]*?)<\/span>)/.source,
    /(?<img>!\[(?<imgAlt>[^\]]*)\]\((?<imgUrl>[^)\s]+)\))/.source,
    /(?<link>\[(?<linkText>[^\]]+)\]\((?<linkUrl>[^)\s]+)\))/.source,
    /(?<strong>\*\*(?<strongText>[\s\S]+?)\*\*|\+\+(?<strongText2>[\s\S]+?)\+\+|__(?<strongText3>[\s\S]+?)__)/.source,
    /(?<em>\*(?<emText>[^*\n]+)\*|_(?<emText2>[^_\n]+)_)/.source,
    /(?<del>~~(?<delText>[\s\S]+?)~~)/.source,
  ].join('|'),
  'g'
)

// Свойства, которые автор поста может задать через <span style="…">.
// Всё остальное отбрасывается, чтобы разметка не могла подгрузить
// внешние ресурсы или сломать вёрстку страницы.
const ALLOWED_STYLE_PROPS = new Set([
  'color',
  'background-color',
  'font-weight',
  'font-style',
  'font-size',
  'font-family',
  'text-decoration',
  'text-transform',
  'letter-spacing',
  'line-height',
  'padding',
  'border-radius',
  'border',
  'opacity',
])

function parseStyle(styleString) {
  const styleObj = {}
  if (!styleString) return styleObj

  for (const rule of styleString.split(';')) {
    const idx = rule.indexOf(':')
    if (idx === -1) continue

    const prop = rule.slice(0, idx).trim().toLowerCase()
    const value = rule.slice(idx + 1).trim()

    if (!prop || !value) continue
    if (!ALLOWED_STYLE_PROPS.has(prop)) continue
    if (/url\s*\(|expression\s*\(|javascript:/i.test(value)) continue

    const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    styleObj[camel] = value
  }

  return styleObj
}

/** Внешние ссылки открываются в новой вкладке, внутренние — нет */
function isExternal(url) {
  return /^https?:\/\//i.test(url)
}

/** Отбрасывает опасные схемы в href */
function safeHref(url) {
  const trimmed = (url || '').trim()
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return '#'
  return trimmed
}

export function processInlineMarkdown(text) {
  if (text === null || text === undefined) return ''
  const source = typeof text === 'string' ? text : String(text)
  if (!source) return ''

  const nodes = []
  let lastIndex = 0
  let key = 0

  INLINE_PATTERN.lastIndex = 0
  let match

  while ((match = INLINE_PATTERN.exec(source)) !== null) {
    // Защита от нулевой длины совпадения — иначе бесконечный цикл
    if (match[0].length === 0) {
      INLINE_PATTERN.lastIndex += 1
      continue
    }

    if (match.index > lastIndex) {
      nodes.push(source.slice(lastIndex, match.index))
    }

    const g = match.groups

    if (g.code) {
      nodes.push(
        <code
          key={key++}
          className="rounded-sm bg-ink/[0.07] px-1.5 py-0.5 font-mono text-[0.85em] text-tile"
        >
          {g.code.slice(1, -1)}
        </code>
      )
    } else if (g.span) {
      nodes.push(
        <span key={key++} style={parseStyle(g.spanStyle)}>
          {processInlineMarkdown(g.spanText)}
        </span>
      )
    } else if (g.img) {
      nodes.push(
        <img
          key={key++}
          src={getFullImageUrl(g.imgUrl) || g.imgUrl}
          alt={g.imgAlt || ''}
          loading="lazy"
          className="my-1 inline-block max-w-full align-middle"
        />
      )
    } else if (g.link) {
      const href = safeHref(g.linkUrl)
      nodes.push(
        <a
          key={key++}
          href={href}
          {...(isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="link-wipe text-tile"
        >
          {processInlineMarkdown(g.linkText)}
        </a>
      )
    } else if (g.strong) {
      const content = g.strongText ?? g.strongText2 ?? g.strongText3 ?? ''
      nodes.push(
        <strong key={key++} className="font-semibold text-ink">
          {processInlineMarkdown(content)}
        </strong>
      )
    } else if (g.em) {
      const content = g.emText ?? g.emText2 ?? ''
      nodes.push(
        <em key={key++} className="italic">
          {processInlineMarkdown(content)}
        </em>
      )
    } else if (g.del) {
      nodes.push(
        <del key={key++} className="text-ink-faint line-through">
          {processInlineMarkdown(g.delText)}
        </del>
      )
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < source.length) {
    nodes.push(source.slice(lastIndex))
  }

  if (nodes.length === 0) return source
  if (nodes.length === 1 && typeof nodes[0] === 'string') return nodes[0]
  return <>{nodes}</>
}

/* ──────────────────────────────────────────────────────────────
   Блочная разметка
   ────────────────────────────────────────────────────────────── */

const HEADING_CLASS = {
  1: 'display mt-14 mb-5 text-[2.4rem] leading-tight',
  2: 'display mt-12 mb-4 text-[1.95rem] leading-tight',
  3: 'display mt-10 mb-3 text-[1.55rem] leading-snug',
  4: 'display mt-8 mb-3 text-[1.3rem]',
  5: 'label mt-8 mb-2 block',
  6: 'label mt-6 mb-2 block',
}

/** Якорь для оглавления — совпадает с логикой TableOfContents */
function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

/** Строка-разделитель таблицы: |---|:--:|---| */
function isTableSeparator(line) {
  const trimmed = line.trim()
  if (!trimmed.includes('-')) return false
  return /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(trimmed)
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim())
}

export const renderMarkdown = (text, options = {}) => {
  if (!text || typeof text !== 'string') {
    return options.emptyText ? (
      <p className="text-ink-faint">{options.emptyText}</p>
    ) : null
  }

  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const elements = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      i++
      continue
    }

    /* ── Блок кода ───────────────────────────────────────────── */
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim()
      const code = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(lines[i])
        i++
      }
      i++ // закрывающий ```

      elements.push(
        <div key={key++} className="my-8">
          {lang && <p className="label mb-2">{lang}</p>}
          <pre className="overflow-x-auto border border-ink/15 bg-ink/[0.04] p-5">
            <code className="font-mono text-[0.85rem] leading-relaxed text-ink">
              {code.join('\n')}
            </code>
          </pre>
        </div>
      )
      continue
    }

    /* ── Заголовок ───────────────────────────────────────────── */
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const headerText = headingMatch[2].trim()
      const Tag = `h${Math.min(level, 6)}`

      elements.push(
        <Tag key={key++} id={slugify(headerText)} className={HEADING_CLASS[level]}>
          {processInlineMarkdown(headerText)}
        </Tag>
      )
      i++
      continue
    }

    /* ── Горизонтальная линейка ──────────────────────────────── */
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      elements.push(
        <div key={key++} className="ornament my-12">
          <span className="label label-tile">◆</span>
        </div>
      )
      i++
      continue
    }

    /* ── Цитата ──────────────────────────────────────────────── */
    if (trimmed.startsWith('>')) {
      const quote = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quote.push(lines[i].trim().replace(/^>\s?/, ''))
        i++
      }

      elements.push(
        <blockquote
          key={key++}
          className="my-8 border-l-2 border-tile py-1 pl-6 font-serif text-[1.15em] italic text-ink/85"
        >
          {processInlineMarkdown(quote.join(' '))}
        </blockquote>
      )
      continue
    }

    /* ── Таблица (только с настоящей строкой-разделителем) ───── */
    if (
      trimmed.includes('|') &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1])
    ) {
      const header = splitTableRow(lines[i])
      i += 2 // заголовок + разделитель

      const rows = []
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(splitTableRow(lines[i]))
        i++
      }

      elements.push(
        <div key={key++} className="my-8 overflow-x-auto">
          <table className="w-full border-collapse text-[0.95em]">
            <thead>
              <tr>
                {header.map((cell, idx) => (
                  <th
                    key={idx}
                    className="label border-b border-ink/30 px-3 py-2.5 text-left align-bottom"
                  >
                    {processInlineMarkdown(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-b border-ink/10">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-3 py-2.5 align-top">
                      {processInlineMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }

    /* ── Список ──────────────────────────────────────────────── */
    const bulletMatch = trimmed.match(/^[-*+]\s+/)
    const orderedMatch = trimmed.match(/^\d+[.)]\s+/)

    if (bulletMatch || orderedMatch) {
      const ordered = Boolean(orderedMatch)
      const items = []

      // Смешанные списки больше не склеиваются в один: цикл идёт
      // только по пунктам того же типа, что и первый.
      while (i < lines.length) {
        const itemLine = lines[i].trim()
        const isBullet = /^[-*+]\s+/.test(itemLine)
        const isOrdered = /^\d+[.)]\s+/.test(itemLine)
        if (ordered ? !isOrdered : !isBullet) break

        items.push(itemLine.replace(/^([-*+]|\d+[.)])\s+/, ''))
        i++
      }

      const ListTag = ordered ? 'ol' : 'ul'
      elements.push(
        <ListTag
          key={key++}
          className={`my-6 space-y-2 pl-6 ${ordered ? 'list-decimal' : 'list-disc'} marker:text-tile`}
        >
          {items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {processInlineMarkdown(item)}
            </li>
          ))}
        </ListTag>
      )
      continue
    }

    /* ── Изображение отдельной строкой ───────────────────────── */
    const imageOnly = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/)
    if (imageOnly) {
      const [, alt, url] = imageOnly
      elements.push(
        <figure key={key++} className="my-10">
          <img
            src={getFullImageUrl(url) || url}
            alt={alt || ''}
            loading="lazy"
            className="w-full"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          {alt && <figcaption className="label mt-3">{alt}</figcaption>}
        </figure>
      )
      i++
      continue
    }

    /* ── Видео ───────────────────────────────────────────────── */
    const videoTag = trimmed.match(/\[🎥\s*Video(?:\s*:\s*([^\]]+))?\]\(([^)\s]+)\)/)
    if (videoTag) {
      elements.push(
        <div key={key++} className="my-10">
          <CustomVideoPlayer src={videoTag[2]} title={videoTag[1] || 'Видео'} />
        </div>
      )
      i++
      continue
    }

    /* ── HTML <img> / <video> ────────────────────────────────── */
    if (trimmed.includes('<img') || trimmed.includes('<video')) {
      let html = trimmed
      let cursor = i
      while (cursor + 1 < lines.length && !html.includes('>')) {
        cursor++
        html += ' ' + lines[cursor].trim()
      }

      const imgSrc = html.match(/<img[^>]+src=["']([^"']+)["']/i)
      const videoSrc = html.match(/<video[^>]+src=["']([^"']+)["']/i)

      if (imgSrc) {
        const alt = html.match(/alt=["']([^"']*)["']/i)?.[1] || ''
        elements.push(
          <figure key={key++} className="my-10">
            <img
              src={getFullImageUrl(imgSrc[1]) || imgSrc[1]}
              alt={alt}
              loading="lazy"
              className="w-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            {alt && <figcaption className="label mt-3">{alt}</figcaption>}
          </figure>
        )
      } else if (videoSrc) {
        const title = html.match(/title=["']([^"']*)["']/i)?.[1] || 'Видео'
        elements.push(
          <div key={key++} className="my-10">
            <CustomVideoPlayer src={videoSrc[1]} title={title} />
          </div>
        )
      }

      i = cursor + 1
      continue
    }

    /* ── Абзац ───────────────────────────────────────────────── */
    // Мягкие переносы внутри абзаца склеиваются, как того требует Markdown
    const paragraph = []
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
      paragraph.push(lines[i].trim())
      i++
    }

    if (paragraph.length > 0) {
      elements.push(
        <p key={key++} className="leading-relaxed">
          {processInlineMarkdown(paragraph.join(' '))}
        </p>
      )
    } else {
      i++
    }
  }

  return elements
}

/** Начинается ли строка с блочной конструкции */
function isBlockStart(line) {
  const t = line.trim()
  return (
    t.startsWith('```') ||
    t.startsWith('>') ||
    /^#{1,6}\s/.test(t) ||
    /^[-*+]\s/.test(t) ||
    /^\d+[.)]\s/.test(t) ||
    /^(-{3,}|\*{3,}|_{3,})$/.test(t) ||
    /^!\[/.test(t) ||
    t.startsWith('<img') ||
    t.startsWith('<video')
  )
}

/**
 * Быстрое преобразование Markdown → HTML.
 * Используется там, где нужен не React-узел, а строка (экспорт поста).
 * Экранирование обязательно: строка попадает в dangerouslySetInnerHTML.
 */
export const markdownToHtml = (markdown) => {
  if (!markdown) return ''
  const source = typeof markdown === 'string' ? markdown : String(markdown)

  const escaped = source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/(\*\*|\+\+|__)(.+?)\1/g, '<strong>$2</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    )
    .replace(/^&gt; (.*)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
}
