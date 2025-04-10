
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
import { useIsCompactView, useViewportHeight } from "@/hooks/use-mobile";

interface NoScrollLayoutProps {
  children: React.ReactNode;
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
  const [currentSection, setCurrentSection] = React.useState(0);
  
  // For calculating container height on mobile/tablet
  const containerStyle = React.useMemo(() => {
    if (isCompactView && viewportHeight) {
      // Adjust for header, tabs, navigation
      const headerHeight = 60; // Header
      const navigationHeight = 60; // Bottom navigation
      const paddingSpace = 32; // Padding
      
      // Calculate available height
      return {
        height: `${viewportHeight - headerHeight - navigationHeight - paddingSpace}px`,
        overflow: 'hidden'
      };
    }
    return {};
  }, [isCompactView, viewportHeight]);
  
  // If we have explicit sections, render as carousel on compact view
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
                  <div className="p-4">
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
  
  // If we don't have sections but still on compact view, contain scrolling
  if (isCompactView) {
    return (
      <div style={containerStyle} className="w-full">
        <ScrollArea className="h-full w-full rounded-md">
          <div className="p-4">
            {children}
          </div>
        </ScrollArea>
      </div>
    );
  }
  
  // Desktop view - normal content
  return <>{children}</>;
}
