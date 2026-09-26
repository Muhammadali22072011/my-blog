/**
 * Чтение видео прямо в браузере: длительность, размеры, кадр для обложки.
 * Всё локально — файл никуда не уходит, пока админ не нажмёт «Сохранить».
 */

const PROBE_TIMEOUT_MS = 15000
const SEEK_TIMEOUT_MS = 8000

/** Длительность и размеры mp4 по метаданным, без загрузки всего файла */
export function probeVideoFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    let done = false
    const finish = (fn, value) => {
      if (done) return
      done = true
      clearTimeout(timer)
      video.onloadedmetadata = null
      video.onerror = null
      // Отпускаем декодер и файл: иначе телефон держит память до перезагрузки вкладки
      video.removeAttribute('src')
      video.load()
      URL.revokeObjectURL(url)
      fn(value)
    }

    const timer = setTimeout(
      () => finish(reject, new Error('Браузер слишком долго читает видео — попробуйте другой файл')),
      PROBE_TIMEOUT_MS
    )

    video.onloadedmetadata = () => {
      const { duration, videoWidth: width, videoHeight: height } = video
      if (!width || !height) {
        finish(reject, new Error('В файле нет видеодорожки, которую понимает браузер'))
        return
      }
      finish(resolve, { duration: Number.isFinite(duration) ? duration : 0, width, height })
    }
    video.onerror = () =>
      finish(
        reject,
        new Error('Браузер не смог прочитать видео. Нужен MP4 с кодеком H.264 (HEVC/H.265 не везде играет)')
      )

    video.src = url
  })
}

/** Перемотка с ожиданием события seeked — только после него кадр готов к отрисовке */
export function seekVideo(video, time) {
  return new Promise((resolve, reject) => {
    const target = Math.max(0, Math.min(time, (video.duration || time) - 0.05))
    if (Math.abs(video.currentTime - target) < 0.01 && video.readyState >= 2) {
      resolve()
      return
    }
    const cleanup = () => {
      clearTimeout(timer)
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', onError)
    }
    const onSeeked = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('Видео не загрузилось'))
    }
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('Кадр не успел загрузиться'))
    }, SEEK_TIMEOUT_MS)
    video.addEventListener('seeked', onSeeked)
    video.addEventListener('error', onError)
    video.currentTime = target
  })
}

/**
 * Текущий кадр → JPEG. Длинная сторона не больше maxSide: обложке
 * хватает 1080 px, а файл остаётся в пределах сотен килобайт.
 * На «заражённом» (чужой домен без CORS) холсте toBlob бросает SecurityError —
 * пробрасываем её как есть, чтобы вызывающий показал понятный совет.
 */
export function captureFrame(video, maxSide = 1080) {
  return new Promise((resolve, reject) => {
    const w = video.videoWidth
    const h = video.videoHeight
    if (!w || !h) {
      reject(new Error('Кадр ещё не готов'))
      return
    }
    const scale = Math.min(1, maxSide / Math.max(w, h))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    try {
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Не удалось сохранить кадр'))),
        'image/jpeg',
        0.85
      )
    } catch (err) {
      reject(err)
    }
  })
}

/** Размеры картинки (для своей обложки) */
export function probeImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Картинка не открывается'))
    }
    img.src = url
  })
}
