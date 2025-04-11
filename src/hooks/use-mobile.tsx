
import * as React from "react"

// Define breakpoints consistently
export const MOBILE_BREAKPOINT = 768
export const TABLET_BREAKPOINT = 1024
export const DESKTOP_BREAKPOINT = 1280

// Orientação
export type Orientation = "portrait" | "landscape"

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
 * Hook that returns screen height for more precise responsive designs
 */
export function useScreenHeight() {
  const [height, setHeight] = React.useState<number | null>(null)
  
  React.useEffect(() => {
    const updateHeight = () => {
      setHeight(window.innerHeight)
    }
    
    // Set initial height
    updateHeight()
    
    // Add event listener
    window.addEventListener('resize', updateHeight)
    
    // Cleanup
    return () => window.removeEventListener('resize', updateHeight)
  }, [])
  
  return height
}

/**
 * Hook to detect screen orientation
 */
export function useOrientation() {
  const [orientation, setOrientation] = React.useState<Orientation>("portrait")
  
  React.useEffect(() => {
    const updateOrientation = () => {
      // Usando matchMedia para uma detecção mais precisa da orientação
      const isLandscape = window.matchMedia("(orientation: landscape)").matches
      setOrientation(isLandscape ? "landscape" : "portrait")
    }
    
    // Set initial orientation
    updateOrientation()
    
    // Add event listeners for both resize and orientation change
    window.addEventListener('resize', updateOrientation)
    
    // Specific orientation change event for mobile devices
    window.addEventListener('orientationchange', updateOrientation)
    
    // Screen orientation API if available
    if (screen.orientation) {
      screen.orientation.addEventListener('change', updateOrientation)
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateOrientation)
      window.removeEventListener('orientationchange', updateOrientation)
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', updateOrientation)
      }
    }
  }, [])
  
  return orientation
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

/**
 * Hook para obter dimensões responsivas baseadas em percentagens
 * Útil para criar layouts fluidos que se adaptam a qualquer tamanho de tela
 */
export function useResponsiveDimension(percentage: number) {
  const screenWidth = useScreenWidth() || 0
  const screenHeight = useScreenHeight() || 0
  
  const width = React.useMemo(() => screenWidth * (percentage / 100), [screenWidth, percentage])
  const height = React.useMemo(() => screenHeight * (percentage / 100), [screenHeight, percentage])
  
  return { width, height }
}

/**
 * Hook que fornece valores de espaçamento adaptativos baseados no tamanho do dispositivo
 */
export function useAdaptiveSpacing() {
  const deviceSize = useDeviceSize()
  
  // Proporciona espaçamentos que se adaptam ao tamanho da tela
  const spacing = React.useMemo(() => {
    switch (deviceSize) {
      case "mobile":
        return {
          xs: '0.5rem',  // 8px
          sm: '0.75rem', // 12px
          md: '1rem',    // 16px
          lg: '1.5rem',  // 24px
          xl: '2rem',    // 32px
        }
      case "tablet":
        return {
          xs: '0.75rem',  // 12px
          sm: '1rem',     // 16px
          md: '1.5rem',   // 24px
          lg: '2rem',     // 32px
          xl: '2.5rem',   // 40px
        }
      case "desktop":
      default:
        return {
          xs: '1rem',     // 16px
          sm: '1.25rem',  // 20px
          md: '1.75rem',  // 28px
          lg: '2.25rem',  // 36px
          xl: '3rem',     // 48px
        }
    }
  }, [deviceSize])
  
  return spacing
}

/**
 * Hook que verifica se o comportamento deve ser otimizado para toque
 * Útil para adaptação de interação entre desktop (mouse) e dispositivos touch
 */
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = React.useState<boolean>(false)
  
  React.useEffect(() => {
    // Verifica se o dispositivo suporta eventos de toque
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
 * Hook para detectar se o teclado virtual está visível em dispositivos móveis
 * Útil para ajustar layouts quando o teclado está visível
 */
export function useVirtualKeyboard() {
  const [isKeyboardVisible, setIsKeyboardVisible] = React.useState<boolean>(false)
  const [keyboardHeight, setKeyboardHeight] = React.useState<number>(0)
  
  React.useEffect(() => {
    let initialHeight = window.innerHeight
    
    const detectKeyboard = () => {
      // Se a altura atual for significativamente menor que a altura inicial,
      // provavelmente o teclado está visível
      const currentHeight = window.innerHeight
      const heightDifference = initialHeight - currentHeight
      
      // Considera o teclado visível se a diferença for maior que 20% da altura
      const threshold = initialHeight * 0.2
      
      if (heightDifference > threshold) {
        setIsKeyboardVisible(true)
        setKeyboardHeight(heightDifference)
      } else {
        setIsKeyboardVisible(false)
        setKeyboardHeight(0)
        // Resetar a altura inicial quando o teclado é fechado
        initialHeight = currentHeight
      }
    }
    
    window.addEventListener('resize', detectKeyboard)
    
    return () => {
      window.removeEventListener('resize', detectKeyboard)
    }
  }, [])
  
  return { isKeyboardVisible, keyboardHeight }
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
