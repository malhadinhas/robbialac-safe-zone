import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "./button"
import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "./scroll-area"
import { useIsMobile } from "@/hooks/use-mobile"

const Tabs = TabsPrimitive.Root

const TabsListVariant = {
  default: "default",
  segment: "segment",
  outline: "outline",
  card: "card",
  fitted: "fitted",
  paginated: "paginated",
  compact: "compact",
  responsive: "responsive",
} as const

type TabsListVariant = (typeof TabsListVariant)[keyof typeof TabsListVariant]

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    variant?: TabsListVariant
  }
>(({ className, variant = "default", ...props }, ref) => {
  const [currentPage, setCurrentPage] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [visibleItems, setVisibleItems] = useState<HTMLElement[]>([])
  const listRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  const paginate = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setCurrentPage(prev => Math.min(prev + 1, pageCount - 1))
    } else {
      setCurrentPage(prev => Math.max(prev - 1, 0))
    }
  }

  useEffect(() => {
    if (variant === "paginated" && listRef.current) {
      const listEl = listRef.current
      const items = Array.from(listEl.querySelectorAll('[role="tab"]')) as HTMLElement[]
      
      if (items.length > 0) {
        setVisibleItems(items)
        items.forEach(item => {
          item.style.display = 'flex'
        })
        
        const calculatePages = () => {
          const containerWidth = listEl.clientWidth - 80
          let currentWidth = 0
          let itemsPerPage = 0

          for (let item of items) {
            currentWidth += item.offsetWidth
            if (currentWidth <= containerWidth) {
              itemsPerPage++
            } else {
              break
            }
          }

          itemsPerPage = Math.max(1, itemsPerPage)
          const newPageCount = Math.ceil(items.length / itemsPerPage)
          
          setPageCount(newPageCount)
          setCurrentPage(prev => Math.min(prev, newPageCount - 1))
          
          items.forEach((item, index) => {
            const startIdx = currentPage * itemsPerPage
            const endIdx = startIdx + itemsPerPage
            item.style.display = index >= startIdx && index < endIdx ? 'flex' : 'none'
          })
        }
        
        calculatePages()
        window.addEventListener('resize', calculatePages)
        
        return () => {
          window.removeEventListener('resize', calculatePages)
        }
      }
    }
  }, [variant, currentPage])

  useEffect(() => {
    if (variant === "paginated" && visibleItems.length > 0 && listRef.current) {
      const listEl = listRef.current
      const containerWidth = listEl.clientWidth - 80
      let currentWidth = 0
      let itemsPerPage = 0

      for (let item of visibleItems) {
        currentWidth += item.offsetWidth
        if (currentWidth <= containerWidth) {
          itemsPerPage++
        } else {
          break
        }
      }

      itemsPerPage = Math.max(1, itemsPerPage)
      
      visibleItems.forEach((item, index) => {
        const startIdx = currentPage * itemsPerPage
        const endIdx = startIdx + itemsPerPage
        item.style.display = index >= startIdx && index < endIdx ? 'flex' : 'none'
      })
    }
  }, [currentPage, variant, visibleItems])

  if (variant === "paginated") {
    return (
      <div className="flex items-center">
        <Button 
          size="icon" 
          variant="ghost" 
          className={cn("flex-shrink-0", currentPage === 0 && "opacity-50 cursor-not-allowed")}
          onClick={() => paginate('prev')}
          disabled={currentPage === 0}
          aria-label="Página anterior"
        >
          <ChevronLeft size={18} />
        </Button>
        
        <TabsPrimitive.List
          ref={(el) => {
            if (typeof ref === 'function') ref(el)
            else if (ref) ref.current = el
            // @ts-ignore - listRef is a React.RefObject<HTMLDivElement>
            listRef.current = el
          }}
          className={cn(
            "flex items-center justify-center flex-1 px-1",
            className
          )}
          {...props}
        />
        
        <Button 
          size="icon" 
          variant="ghost" 
          className={cn("flex-shrink-0", currentPage >= pageCount - 1 && "opacity-50 cursor-not-allowed")}
          onClick={() => paginate('next')}
          disabled={currentPage >= pageCount - 1}
          aria-label="Próxima página"
        >
          <ChevronRight size={18} />
        </Button>
      </div>
    )
  }
  
  if (variant === "responsive") {
    return (
      <TabsPrimitive.List
        ref={ref}
        className={cn(
          "flex items-center justify-center w-full",
          isMobile ? "overflow-x-auto gap-1 py-1 no-scrollbar" : "flex-wrap gap-2",
          className
        )}
        {...props}
      />
    )
  }
  
  if (variant === "compact") {
    return (
      <TabsPrimitive.List
        ref={ref}
        className={cn(
          "flex items-center justify-start overflow-x-auto no-scrollbar",
          className
        )}
        {...props}
      />
    )
  }

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center",
        {
          "h-10 rounded-md bg-muted p-1 text-muted-foreground": variant === "default",
          "bg-transparent p-0 text-muted-foreground space-x-1": variant === "segment",
          "h-9 border-b border-border text-muted-foreground": variant === "outline",
          "w-full flex-wrap gap-2 bg-transparent p-0 text-muted-foreground": variant === "card",
          "w-full flex-nowrap overflow-x-auto gap-0 bg-transparent p-0 text-muted-foreground": variant === "fitted",
        },
        className
      )}
      {...props}
    />
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTriggerVariant = {
  default: "default",
  segment: "segment",
  outline: "outline", 
  card: "card",
  fitted: "fitted",
  paginated: "paginated",
  compact: "compact",
  responsive: "responsive",
} as const

type TabsTriggerVariant = (typeof TabsTriggerVariant)[keyof typeof TabsTriggerVariant]

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    variant?: TabsTriggerVariant
    fullWidth?: boolean
    shortLabel?: string
  }
>(({ className, variant = "default", fullWidth, shortLabel, children, ...props }, ref) => {
  const isMobile = useIsMobile()
  const displayContent = isMobile && shortLabel ? shortLabel : children
  
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        {
          "rounded-sm px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm": 
            variant === "default",
          "h-8 rounded-md px-2.5 py-1 text-xs data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border": 
            variant === "segment",
          "rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 data-[state=active]:border-b-primary data-[state=active]:text-foreground": 
            variant === "outline",
          "rounded-md border border-border bg-background px-3 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/50": 
            variant === "card",
          "flex-1 rounded-none border-b-2 border-b-transparent px-3 py-2 data-[state=active]:border-b-primary data-[state=active]:text-foreground": 
            variant === "fitted",
          "flex-1 rounded-md border border-border bg-background px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground": 
            variant === "paginated",
          "px-3 py-1.5 rounded-md data-[state=active]:text-primary data-[state=active]:bg-primary/10": 
            variant === "compact",
          "px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground": 
            variant === "responsive",
        },
        fullWidth && "flex-1",
        className
      )}
      {...props}
    >
      {displayContent}
    </TabsPrimitive.Trigger>
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
