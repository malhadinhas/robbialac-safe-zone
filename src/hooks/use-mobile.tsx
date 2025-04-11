
import * as React from "react"

// Define breakpoints consistently
export const MOBILE_BREAKPOINT = 768
export const TABLET_BREAKPOINT = 1024
export const DESKTOP_BREAKPOINT = 1280

/**
 * Hook that returns whether the current viewport is mobile size
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Initial check
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Check on mount with timeout to ensure DOM is fully loaded
    checkMobile()
    
    // Add event listener for resize
    window.addEventListener("resize", checkMobile)
    
    // Cleanup
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return isMobile
}

/**
 * Hook that returns whether the current viewport is tablet size
 */
export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth
      setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT)
    }
    
    // Check on mount
    checkTablet()
    
    // Add event listener for resize
    window.addEventListener("resize", checkTablet)
    
    // Cleanup
    return () => window.removeEventListener("resize", checkTablet)
  }, [])

  return isTablet
}

/**
 * Hook that returns the current device size category
 */
export function useDeviceSize() {
  const [size, setSize] = React.useState<"mobile" | "tablet" | "desktop" | null>(null)

  React.useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth
      if (width < MOBILE_BREAKPOINT) {
        setSize("mobile")
      } else if (width < TABLET_BREAKPOINT) {
        setSize("tablet")
      } else {
        setSize("desktop")
      }
    }
    
    // Check on mount
    checkSize()
    
    // Add event listener for resize
    window.addEventListener("resize", checkSize)
    
    // Cleanup
    return () => window.removeEventListener("resize", checkSize)
  }, [])

  return size
}

/**
 * Hook that returns screen width for more precise responsive designs
 */
export function useScreenWidth() {
  const [width, setWidth] = React.useState<number | null>(null)
  
  React.useEffect(() => {
    const updateWidth = () => {
      setWidth(window.innerWidth)
    }
    
    // Set initial width
    updateWidth()
    
    // Add event listener
    window.addEventListener('resize', updateWidth)
    
    // Cleanup
    return () => window.removeEventListener('resize', updateWidth)
  }, [])
  
  return width
}

/**
 * Hook to check if current viewport requires collapsed sidebar layout
 * Returns true for mobile and tablet views
 */
export function useIsCompactView() {
  const [isCompactView, setIsCompactView] = React.useState<boolean>(false)
  
  React.useEffect(() => {
    const checkCompactView = () => {
      setIsCompactView(window.innerWidth < TABLET_BREAKPOINT)
    }
    
    // Check on mount
    checkCompactView()
    
    // Add event listener for resize
    window.addEventListener("resize", checkCompactView)
    
    // Cleanup
    return () => window.removeEventListener("resize", checkCompactView)
  }, [])
  
  return isCompactView
}

/**
 * Hook to check if the sidebar should be collapsed by default
 * Returns true for tablet and mobile views (always collapsed by default)
 */
export function useShouldCollapseMenu() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  
  return isTablet || isMobile
}

/**
 * Get viewport height for precise container sizing
 */
export function useViewportHeight() {
  const [height, setHeight] = React.useState<number | null>(null)
  
  React.useEffect(() => {
    const updateHeight = () => {
      // Use visualViewport when available for more accurate mobile height
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      setHeight(viewportHeight)
    }
    
    // Set initial height
    updateHeight()
    
    // Add event listeners
    window.addEventListener('resize', updateHeight)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight)
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateHeight)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateHeight)
      }
    }
  }, [])
  
  return height
}
