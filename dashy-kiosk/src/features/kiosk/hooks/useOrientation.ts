import { useState, useEffect } from 'react'

export type Orientation = 'landscape' | 'portrait'

export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>(() =>
    window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
  )

  useEffect(() => {
    const update = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
    }
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return orientation
}
