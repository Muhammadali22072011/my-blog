import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col justify-center px-5 py-24 sm:px-8">
      <p className="label">Ошибка 404</p>

      <h1 className="display mt-4 text-[clamp(3rem,12vw,8rem)] leading-[0.9]">
        Такой
        <span className="block text-tile">полосы</span>
        нет
      </h1>

      <p className="mt-8 max-w-measure text-lg text-ink-soft">
        Материал переехал, был снят с публикации или адрес набран с опечаткой.
        Попробуйте найти нужное в указателе.
      </p>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link to="/blogs" className="btn-primary">
          В указатель
        </Link>
        <Link to="/" className="btn-secondary">
          На главную
        </Link>
      </div>
    </div>
  )
}

export default NotFound
