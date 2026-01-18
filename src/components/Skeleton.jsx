function Skeleton({ className = '', variant = 'text', count = 1 }) {
  const baseClass = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]'
  
  const variants = {
    text: 'h-4 rounded',
    title: 'h-8 rounded-lg w-3/4',
    avatar: 'w-12 h-12 rounded-full',
    thumbnail: 'w-full h-48 rounded-xl',
    card: 'w-full h-64 rounded-2xl',
    button: 'h-10 w-24 rounded-lg'
  }

  const items = Array.from({ length: count }, (_, i) => i)

  return (
    <>
      {items.map((i) => (
        <div
          key={i}
          className={`${baseClass} ${variants[variant] || variants.text} ${className}`}
          style={{ animation: 'shimmer 1.5s infinite' }}
        />
      ))}
    </>
  )
}

// Blog post skeleton
export function PostSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="text" className="w-24" />
        <Skeleton variant="text" className="w-16" />
        <Skeleton variant="text" className="w-20" />
      </div>
      <Skeleton variant="title" className="mb-3" />
      <Skeleton variant="text" className="mb-2" />
      <Skeleton variant="text" className="mb-2" />
      <Skeleton variant="text" className="w-2/3" />
    </div>
  )
}

// Blog list skeleton
export function BlogListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }, (_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  )
}

// Profile skeleton
export function ProfileSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
      <Skeleton variant="avatar" className="w-32 h-32 lg:w-40 lg:h-40 rounded-2xl" />
      <div className="flex-1 text-center lg:text-left">
        <Skeleton variant="title" className="mb-4 mx-auto lg:mx-0" />
        <Skeleton variant="text" className="w-48 mb-6 mx-auto lg:mx-0" />
        <div className="flex justify-center lg:justify-start gap-3 mb-6">
          <Skeleton variant="avatar" className="w-10 h-10 rounded-xl" />
          <Skeleton variant="avatar" className="w-10 h-10 rounded-xl" />
          <Skeleton variant="avatar" className="w-10 h-10 rounded-xl" />
        </div>
        <Skeleton variant="text" className="mb-2" />
        <Skeleton variant="text" className="mb-2" />
        <Skeleton variant="text" className="w-3/4" />
      </div>
    </div>
  )
}

export default Skeleton
