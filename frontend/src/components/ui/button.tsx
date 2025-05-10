
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        responsive: "h-9 px-2 min-w-[70px] sm:h-10 sm:px-3 md:px-4", // Improved for small sizes
        "ultra-responsive": "h-8 px-2 w-auto sm:h-9 sm:px-3 md:px-4 lg:h-10 lg:px-4", // Even more responsive
        "compact": "h-7 px-1.5 text-xs sm:h-8 sm:px-2 md:h-9 md:px-3 md:text-sm", // New compact size for no-scroll layouts
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
      iconOnly: {
        true: "p-0 aspect-square",
        false: "",
      },
    },
    compoundVariants: [
      {
        size: "responsive",
        iconOnly: true,
        className: "h-9 w-9 sm:h-10 sm:w-10", // Adjusted to be responsive even as an icon
      },
      {
        size: "ultra-responsive",
        iconOnly: true,
        className: "h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10", // Even smaller on mobile
      },
      {
        size: "compact",
        iconOnly: true,
        className: "h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8", // Compact icon size
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
      iconOnly: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  fullWidth?: boolean
  iconOnly?: boolean
  shortText?: string // Prop for responsive text
  compactText?: string // Even shorter text for compact views
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, iconOnly, asChild = false, shortText, compactText, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isMobile = useIsMobile()
    
    // Select appropriate display text based on screen size
    let displayContent = children
    
    // For very small screens, use compactText if available
    if (isMobile && compactText) {
      displayContent = compactText
    }
    // For mobile, use shortText if available and compactText isn't
    else if (isMobile && shortText) {
      displayContent = shortText
    }
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, iconOnly, className }))}
        ref={ref}
        {...props}
      >
        {displayContent}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
