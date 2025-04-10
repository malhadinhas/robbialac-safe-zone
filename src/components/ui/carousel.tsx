
import * as React from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useIsMobile, useIsTablet, useViewportHeight } from "@/hooks/use-mobile"

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
  fullHeight?: boolean // New prop for full-height carousels
  compactControls?: boolean // Compact navigation controls
  currentIndex?: number // Current slide index
  totalSlides?: number // Total number of slides
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
  currentIndex?: number
  totalSlides?: number
  compactControls?: boolean
  fullHeight?: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      fullHeight = false,
      compactControls = false,
      currentIndex,
      totalSlides,
      ...props
    },
    ref
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins
    )
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)
    const viewportHeight = useViewportHeight()
    const isMobile = useIsMobile()
    const isTablet = useIsTablet()

    // Calculate height for full-height carousels
    const containerStyle = React.useMemo(() => {
      if (fullHeight && viewportHeight && (isMobile || isTablet)) {
        // Adjust height to fit content within viewport on mobile/tablet
        // Subtract header, navigation, and other UI elements
        const headerHeight = 60; // Approximate height of the header
        const navigationHeight = 56; // Approximate height of bottom navigation
        const paddingSpace = 32; // Account for padding
        
        return {
          height: `${viewportHeight - headerHeight - navigationHeight - paddingSpace}px`,
        };
      }
      return {};
    }, [fullHeight, viewportHeight, isMobile, isTablet]);

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) {
        return
      }

      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }, [])

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev()
    }, [api])

    const scrollNext = React.useCallback(() => {
      api?.scrollNext()
    }, [api])

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          scrollPrev()
        } else if (event.key === "ArrowRight") {
          event.preventDefault()
          scrollNext()
        }
      },
      [scrollPrev, scrollNext]
    )

    React.useEffect(() => {
      if (!api || !setApi) {
        return
      }

      setApi(api)
    }, [api, setApi])

    React.useEffect(() => {
      if (!api) {
        return
      }

      onSelect(api)
      api.on("reInit", onSelect)
      api.on("select", onSelect)

      return () => {
        api?.off("select", onSelect)
      }
    }, [api, onSelect])

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation:
            orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
          compactControls,
          fullHeight,
          currentIndex,
          totalSlides,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          style={containerStyle}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation, fullHeight } = useCarousel()

  return (
    <div ref={carouselRef} className={cn("overflow-hidden", fullHeight && "h-full")}>
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          fullHeight && "h-full",
          className
        )}
        {...props}
      />
    </div>
  )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation, fullHeight } = useCarousel()

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        fullHeight && "h-full overflow-hidden",
        className
      )}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev, compactControls } = useCarousel()
  
  const buttonSize = compactControls ? "compact" : size;
  const buttonVariant = compactControls ? "ghost" : variant;

  return (
    <Button
      ref={ref}
      variant={buttonVariant}
      size={buttonSize}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        compactControls ? "bg-background/80 shadow-sm" : "",
        orientation === "horizontal"
          ? compactControls 
            ? "-left-1 top-1/2 -translate-y-1/2 z-10" 
            : "-left-12 top-1/2 -translate-y-1/2"
          : compactControls
            ? "-top-1 left-1/2 -translate-x-1/2 rotate-90 z-10"
            : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className={cn("h-4 w-4", compactControls && "h-3 w-3")} />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext, compactControls } = useCarousel()
  
  const buttonSize = compactControls ? "compact" : size;
  const buttonVariant = compactControls ? "ghost" : variant;

  return (
    <Button
      ref={ref}
      variant={buttonVariant}
      size={buttonSize}
      className={cn(
        "absolute",
        compactControls ? "bg-background/80 shadow-sm" : "",
        orientation === "horizontal"
          ? compactControls 
            ? "-right-1 top-1/2 -translate-y-1/2 z-10" 
            : "-right-12 top-1/2 -translate-y-1/2"
          : compactControls
            ? "-bottom-1 left-1/2 -translate-x-1/2 rotate-90 z-10"
            : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className={cn("h-4 w-4", compactControls && "h-3 w-3")} />
      <span className="sr-only">Next slide</span>
    </Button>
  )
})
CarouselNext.displayName = "CarouselNext"

const CarouselPagination = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { currentIndex, totalSlides } = useCarousel();
  
  if (currentIndex === undefined || totalSlides === undefined) {
    return null;
  }
  
  return (
    <div 
      ref={ref}
      className={cn(
        "absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center space-x-1 z-10",
        className
      )}
      {...props}
    >
      <span className="text-xs bg-background/80 px-2 py-0.5 rounded-full">
        {currentIndex + 1} / {totalSlides}
      </span>
    </div>
  );
});
CarouselPagination.displayName = "CarouselPagination";

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselPagination,
}
