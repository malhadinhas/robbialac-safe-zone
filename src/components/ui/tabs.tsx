
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "./button"
import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "./scroll-area"

const Tabs = TabsPrimitive.Root

const TabsListVariant = {
  default: "default",
  segment: "segment",
  outline: "outline",
  card: "card",
  fitted: "fitted",
  paginated: "paginated",
  compact: "compact",
} as const

// Define the type using the object values
type TabsListVariant = typeof TabsListVariant[keyof typeof TabsListVariant]

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

  // Função para paginar as tabs quando no modo paginated
  const paginate = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setCurrentPage(prev => Math.min(prev + 1, pageCount - 1))
    } else {
      setCurrentPage(prev => Math.max(prev - 1, 0))
    }
  }

  // Efeito para calcular páginas quando no modo paginated
  useEffect(() => {
    if (variant === TabsListVariant.paginated && listRef.current) {
      const listEl = listRef.current
      const items = Array.from(listEl.querySelectorAll('[role="tab"]')) as HTMLElement[]
      
      if (items.length > 0) {
        setVisibleItems(items)
        // Mostra todos os itens inicialmente para fazer o cálculo
        items.forEach(item => {
          item.style.display = 'flex'
        })
        
        // Recalcula quando o tamanho da janela muda
        const calculatePages = () => {
          const containerWidth = listEl.clientWidth - 80 // Espaço para os botões de navegação
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

          // Garantir que pelo menos um item seja mostrado
          itemsPerPage = Math.max(1, itemsPerPage)
          const newPageCount = Math.ceil(items.length / itemsPerPage)
          
          setPageCount(newPageCount)
          // Ajusta a página atual se necessário
          setCurrentPage(prev => Math.min(prev, newPageCount - 1))
          
          // Atualiza visibilidade
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

  // Atualiza a visibilidade dos itens quando a página muda
  useEffect(() => {
    if (variant === TabsListVariant.paginated && visibleItems.length > 0 && listRef.current) {
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

  if (variant === TabsListVariant.paginated) {
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
  
  // Para variante compacta, usar ScrollArea
  if (variant === TabsListVariant.compact) {
    return (
      <ScrollArea className="w-full">
        <TabsPrimitive.List
          ref={ref}
          className={cn(
            "min-w-max inline-flex items-center justify-start",
            className
          )}
          {...props}
        />
      </ScrollArea>
    )
  }

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center",
        {
          "h-10 rounded-md bg-muted p-1 text-muted-foreground": variant === TabsListVariant.default,
          "bg-transparent p-0 text-muted-foreground space-x-1": variant === TabsListVariant.segment,
          "h-9 border-b border-border text-muted-foreground": variant === TabsListVariant.outline,
          "w-full flex-wrap gap-2 bg-transparent p-0 text-muted-foreground": variant === TabsListVariant.card,
          "w-full flex-nowrap overflow-x-auto gap-0 bg-transparent p-0 text-muted-foreground": variant === TabsListVariant.fitted,
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
} as const

type TabsTriggerVariant = typeof TabsTriggerVariant[keyof typeof TabsTriggerVariant]

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    variant?: TabsTriggerVariant
    fullWidth?: boolean
  }
>(({ className, variant = "default", fullWidth, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      {
        "rounded-sm px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm": variant === TabsTriggerVariant.default,
        "h-8 rounded-md px-2.5 py-1 text-xs data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border": variant === TabsTriggerVariant.segment,
        "rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 data-[state=active]:border-b-primary data-[state=active]:text-foreground": variant === TabsTriggerVariant.outline,
        "rounded-md border border-border bg-background px-3 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/50": variant === TabsTriggerVariant.card,
        "flex-1 rounded-none border-b-2 border-b-transparent px-3 py-2 data-[state=active]:border-b-primary data-[state=active]:text-foreground": variant === TabsTriggerVariant.fitted,
        "flex-1 rounded-md border border-border bg-background px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground": variant === TabsTriggerVariant.paginated,
        "px-3 py-1.5 rounded-md data-[state=active]:text-primary data-[state=active]:bg-primary/10": variant === TabsTriggerVariant.compact,
      },
      fullWidth && "flex-1",
      className
    )}
    {...props}
  />
))
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
