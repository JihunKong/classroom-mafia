// client/src/hooks/useResponsive.ts

import { useState, useEffect } from 'react'

interface ResponsiveState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  width: number
  height: number
  orientation: 'portrait' | 'landscape'
}

export const useResponsive = () => {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: 1024,
        height: 768,
        orientation: 'landscape' as const
      }
    }

    const width = window.innerWidth
    const height = window.innerHeight
    
    return {
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      width,
      height,
      orientation: width > height ? 'landscape' : 'portrait'
    }
  })

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setState({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        width,
        height,
        orientation: width > height ? 'landscape' : 'portrait'
      })
    }

    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated after orientation change
      setTimeout(handleResize, 100)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  return state
}

// Hook for specific breakpoint detection
export const useBreakpoint = (breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl') => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const breakpoints = {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536
    }

    const mediaQuery = window.matchMedia(`(min-width: ${breakpoints[breakpoint]}px)`)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    setMatches(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [breakpoint])

  return matches
}

// Hook for device type detection
export const useDeviceType = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive()
  
  const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  
  // Additional device detection
  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isAndroid = typeof window !== 'undefined' && /Android/.test(navigator.userAgent)
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window
  
  return {
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    isIOS,
    isAndroid,
    isTouchDevice
  }
}