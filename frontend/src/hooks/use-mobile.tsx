import * as React from "react"

// Breakpoints
export const MOBILE_BREAKPOINT = 640
export const TABLET_BREAKPOINT = 1024
export const DESKTOP_BREAKPOINT = 1280

/**
 * Hook que retorna se a viewport atual é tamanho mobile
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return isMobile
}

/**
 * Hook que retorna se a viewport atual é tamanho tablet
 */
export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth
      setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT)
    }
    
    checkTablet()
    window.addEventListener("resize", checkTablet)
    return () => window.removeEventListener("resize", checkTablet)
  }, [])

  return isTablet
}

/**
 * Hook que retorna a categoria atual do dispositivo
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
    
    checkSize()
    window.addEventListener("resize", checkSize)
    return () => window.removeEventListener("resize", checkSize)
  }, [])

  return size
}

/**
 * Hook que retorna se a visualização atual deve ser compacta (mobile ou tablet)
 */
export function useIsCompactView() {
  const [isCompact, setIsCompact] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkCompact = () => {
      setIsCompact(window.innerWidth < TABLET_BREAKPOINT)
    }
    
    checkCompact()
    window.addEventListener("resize", checkCompact)
    return () => window.removeEventListener("resize", checkCompact)
  }, [])

  return isCompact
}

/**
 * Hook que retorna se o menu deve ser colapsado (apenas mobile)
 */
export function useShouldCollapseMenu() {
  const isMobile = useIsMobile()
  return isMobile
}

/**
 * Hook que retorna a orientação atual do dispositivo
 */
export function useOrientation() {
  const [orientation, setOrientation] = React.useState<"portrait" | "landscape">("portrait")

  React.useEffect(() => {
    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? "portrait" : "landscape")
    }
    
    checkOrientation()
    window.addEventListener("resize", checkOrientation)
    return () => window.removeEventListener("resize", checkOrientation)
  }, [])

  return orientation
}

/**
 * Hook que retorna a altura da viewport
 */
export function useViewportHeight() {
  const [height, setHeight] = React.useState<number | null>(null)
  
  React.useEffect(() => {
    const updateHeight = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight
      setHeight(viewportHeight)
    }
    
    updateHeight()
    window.addEventListener('resize', updateHeight)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight)
    }
    
    return () => {
      window.removeEventListener('resize', updateHeight)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateHeight)
      }
    }
  }, [])
  
  return height
}

/**
 * Hook que fornece valores de espaçamento adaptativos baseados no tamanho do dispositivo
 */
export function useAdaptiveSpacing() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  
  return {
    xs: isMobile ? '0.5rem' : '0.75rem',
    sm: isMobile ? '0.75rem' : isTablet ? '1rem' : '1.25rem',
    md: isMobile ? '1rem' : isTablet ? '1.5rem' : '2rem',
    lg: isMobile ? '1.5rem' : isTablet ? '2rem' : '3rem',
    xl: isMobile ? '2rem' : isTablet ? '3rem' : '4rem'
  }
}

/**
 * Hook que verifica se o dispositivo suporta interação por toque
 */
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = React.useState<boolean>(false)
  
  React.useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - Microsoft-specific
        navigator.msMaxTouchPoints > 0
      )
    }
    
    checkTouch()
  }, [])
  
  return isTouch
}

/**
 * Hook para calcular o tamanho de texto responsivo baseado no viewport
 */
export function useResponsiveFont(baseSize: number = 16) {
  const screenWidth = useScreenWidth() || 0
  
  // Calcula o tamanho da fonte com base em vw (viewport width)
  // com limites mínimos e máximos para evitar textos muito pequenos ou grandes
  const fontSize = React.useMemo(() => {
    // 1vw = 1% da largura da viewport
    const vwSize = screenWidth * 0.01
    
    // Calcula o tamanho baseado em vw com base no tamanho passado
    let size = (baseSize * vwSize) / 10
    
    // Limites para evitar fontes muito pequenas ou muito grandes
    const minSize = baseSize * 0.8
    const maxSize = baseSize * 1.4
    
    if (size < minSize) size = minSize
    if (size > maxSize) size = maxSize
    
    return `${size}px`
  }, [screenWidth, baseSize])
  
  return fontSize
}
