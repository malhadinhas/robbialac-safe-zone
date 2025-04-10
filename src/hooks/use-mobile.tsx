
import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Check on mount
    checkMobile()
    
    // Add event listener for resize
    window.addEventListener("resize", checkMobile)
    
    // Cleanup
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return isMobile
}

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
