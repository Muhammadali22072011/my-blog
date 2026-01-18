import { useEffect, useRef, useState } from 'react'

function AnimateOnScroll({ 
  children, 
  className = '', 
  animation = 'fade-up', // fade-up, fade-in, scale-in, slide-left, slide-right
  delay = 0,
  threshold = 0.1,
  once = true 
}) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) {
            observer.unobserve(entry.target)
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [threshold, once])

  const animations = {
    'fade-up': {
      hidden: 'opacity-0 translate-y-8',
      visible: 'opacity-100 translate-y-0'
    },
    'fade-in': {
      hidden: 'opacity-0',
      visible: 'opacity-100'
    },
    'scale-in': {
      hidden: 'opacity-0 scale-95',
      visible: 'opacity-100 scale-100'
    },
    'slide-left': {
      hidden: 'opacity-0 translate-x-8',
      visible: 'opacity-100 translate-x-0'
    },
    'slide-right': {
      hidden: 'opacity-0 -translate-x-8',
      visible: 'opacity-100 translate-x-0'
    }
  }

  const anim = animations[animation] || animations['fade-up']

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${isVisible ? anim.visible : anim.hidden} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export default AnimateOnScroll
