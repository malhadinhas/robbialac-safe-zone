
import * as React from "react";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious,
  CarouselPagination
} from "@/components/ui/carousel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  useIsCompactView, 
  useViewportHeight, 
  useIsMobile, 
  useIsTablet,
  useOrientation,
  useAdaptiveSpacing
} from "@/hooks/use-mobile";

interface NoScrollLayoutProps {
  children?: React.ReactNode;
  sections?: React.ReactNode[];
  showNavigation?: boolean;
  showPagination?: boolean;
  maxContentHeight?: string | number;
  className?: string; // Add className prop for additional styling
}

/**
 * NoScrollLayout provides a container that optimizes content for no-scroll 
 * display on mobile and tablet devices.
 * 
 * - On desktop: Regular scrolling layout
 * - On mobile/tablet: Carousel with sections or contained scrolling
 */
export function NoScrollLayout({
  children,
  sections = [],
  showNavigation = true,
  showPagination = true,
  maxContentHeight,
  className,
}: NoScrollLayoutProps) {
  const isCompactView = useIsCompactView();
  const viewportHeight = useViewportHeight();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const orientation = useOrientation();
  const spacing = useAdaptiveSpacing();
  const [currentSection, setCurrentSection] = React.useState(0);
  
  // Para calcular a altura do container adaptável
  const containerStyle = React.useMemo(() => {
    if (isCompactView && viewportHeight) {
      // Ajustes dinâmicos com base no dispositivo e orientação
      const headerHeight = 60; // Header fixo
      const navigationHeight = orientation === "portrait" ? 60 : 40; // Navigation bar (menor em landscape)
      const paddingSpace = isMobile ? 32 : 48; // Padding maior para tablet
      const bottomSafeArea = 16; // Área segura para notches e barras de sistema
      
      // Em modo retrato vs paisagem
      const heightAdjustment = orientation === "landscape" ? 20 : 0;
      
      // Altura calculada adaptável
      const calculatedHeight = viewportHeight - headerHeight - navigationHeight - paddingSpace - bottomSafeArea - heightAdjustment;
      
      // Se temos uma altura máxima definida, use o menor valor
      const finalHeight = maxContentHeight 
        ? `min(${calculatedHeight}px, ${typeof maxContentHeight === 'number' ? `${maxContentHeight}px` : maxContentHeight})`
        : `${calculatedHeight}px`;
        
      return {
        height: finalHeight,
        overflow: 'hidden',
        padding: spacing.sm
      };
    }
    
    // Para desktop
    if (maxContentHeight) {
      return {
        maxHeight: maxContentHeight
      };
    }
    
    return {};
  }, [isCompactView, viewportHeight, isMobile, orientation, maxContentHeight, spacing]);
  
  // Se temos seções explícitas, renderizar como carousel em compact view
  if (sections.length > 0 && isCompactView) {
    return (
      <div style={containerStyle} className={cn("w-full", className)}>
        <Carousel 
          fullHeight 
          compactControls={orientation === "landscape" || isMobile}
          currentIndex={currentSection}
          totalSlides={sections.length}
          opts={{
            loop: false,
            align: "start"
          }}
          setApi={(api) => {
            api?.on("select", () => {
              setCurrentSection(api.selectedScrollSnap());
            });
          }}
          className="w-full h-full"
        >
          <CarouselContent className="h-full">
            {sections.map((section, index) => (
              <CarouselItem key={index} className="relative h-full">
                <ScrollArea className="h-full rounded-md">
                  <div className={cn(
                    "p-2",
                    isTablet && orientation === "portrait" && "p-3",
                    !isMobile && orientation === "landscape" && "p-4"
                  )}>
                    {section}
                  </div>
                </ScrollArea>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {showNavigation && sections.length > 1 && orientation === "portrait" && (
            <>
              <CarouselPrevious className="left-2 size-8 sm:size-10" />
              <CarouselNext className="right-2 size-8 sm:size-10" />
            </>
          )}
          
          {showPagination && sections.length > 1 && (
            <CarouselPagination 
              className={orientation === "landscape" ? "bottom-1" : "bottom-2"}
            />
          )}
        </Carousel>
      </div>
    );
  }
  
  // Se não temos seções mas ainda estamos em compact view, conter scrolling
  if (isCompactView) {
    return (
      <div style={containerStyle} className={cn("w-full", className)}>
        <ScrollArea className="h-full w-full rounded-md">
          <div className={cn(
            "p-2",
            isTablet && orientation === "portrait" && "p-3",
            !isMobile && orientation === "landscape" && "p-4"
          )}>
            {children}
          </div>
        </ScrollArea>
      </div>
    );
  }
  
  // Desktop view - conteúdo em container com max-height se especificado
  return (
    <div style={containerStyle} className={cn("w-full", className)}>
      {children}
    </div>
  );
}

// Utilitário para combinar classes condicionalmente
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
