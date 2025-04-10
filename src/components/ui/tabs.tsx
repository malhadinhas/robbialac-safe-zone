
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    variant?: "default" | "segment" | "outline" | "card" | "fitted"
  }
>(({ className, variant = "default", ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center",
      variant === "default" && "h-10 rounded-md bg-muted p-1 text-muted-foreground",
      variant === "segment" && "bg-transparent p-0 text-muted-foreground space-x-1",
      variant === "outline" && "h-9 border-b border-border text-muted-foreground",
      variant === "card" && "w-full flex-wrap gap-2 bg-transparent p-0 text-muted-foreground",
      variant === "fitted" && "w-full flex-nowrap overflow-x-auto gap-0 bg-transparent p-0 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    variant?: "default" | "segment" | "outline" | "card" | "fitted"
    fullWidth?: boolean
  }
>(({ className, variant = "default", fullWidth, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      variant === "default" && "rounded-sm px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      variant === "segment" && "h-8 rounded-md px-2.5 py-1 text-xs data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border",
      variant === "outline" && "rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 data-[state=active]:border-b-primary data-[state=active]:text-foreground",
      variant === "card" && "rounded-md border border-border bg-background px-3 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/50",
      variant === "fitted" && "flex-1 rounded-none border-b-2 border-b-transparent px-3 py-2 data-[state=active]:border-b-primary data-[state=active]:text-foreground",
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
