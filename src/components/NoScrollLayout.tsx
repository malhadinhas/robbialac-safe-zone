
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
import { useIsCompactView, useViewportHeight, useIsMobile, useIsTablet } from "@/hooks/use-mobile";

interface NoScrollLayoutProps {
  children?: React.ReactNode; // Making children optional
  sections?: React.ReactNode[];
  showNavigation?: boolean;
  showPagination?: boolean;
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
}: NoScrollLayoutProps) {
  const isCompactView = useIsCompactView();
  const viewportHeight = useViewportHeight();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [currentSection, setCurrentSection] = React.useState(0);
  
  // Para calcular a altura do container em mobile/tablet
  const containerStyle = React.useMemo(() => {
    if (isCompactView && viewportHeight) {
      // Ajustar para header, tabs, navigation
      const headerHeight = 60; // Header
      const navigationHeight = 60; // Bottom navigation
      const paddingSpace = isMobile ? 32 : 48; // Padding maior para tablet
      
      // Calcular altura disponível
      return {
        height: `${viewportHeight - headerHeight - navigationHeight - paddingSpace}px`,
        overflow: 'hidden'
      };
    }
    return {};
  }, [isCompactView, viewportHeight, isMobile]);
  
  // Se temos seções explícitas, renderizar como carousel em compact view
  if (sections.length > 0 && isCompactView) {
    return (
      <div style={containerStyle} className="w-full">
        <Carousel 
          fullHeight 
          compactControls={true}
          currentIndex={currentSection}
          totalSlides={sections.length}
          opts={{
            loop: false,
          }}
          setApi={(api) => {
            api?.on("select", () => {
              setCurrentSection(api.selectedScrollSnap());
            });
          }}
        >
          <CarouselContent>
            {sections.map((section, index) => (
              <CarouselItem key={index} className="relative">
                <ScrollArea className="h-full rounded-md">
                  <div className={cn("p-4", isTablet && "p-6")}>
                    {section}
                  </div>
                </ScrollArea>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {showNavigation && sections.length > 1 && (
            <>
              <CarouselPrevious />
              <CarouselNext />
            </>
          )}
          
          {showPagination && sections.length > 1 && <CarouselPagination />}
        </Carousel>
      </div>
    );
  }
  
  // Se não temos seções mas ainda estamos em compact view, conter scrolling
  if (isCompactView) {
    return (
      <div style={containerStyle} className="w-full">
        <ScrollArea className="h-full w-full rounded-md">
          <div className={cn("p-4", isTablet && "p-6")}>
            {children}
          </div>
        </ScrollArea>
      </div>
    );
  }
  
  // Desktop view - conteúdo normal
  return <>{children}</>;
}

// Utilitário para combinar classes condicionalmente
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
