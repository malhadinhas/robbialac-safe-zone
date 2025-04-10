
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
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
        "ultra-responsive": "h-9 px-2 w-auto sm:h-10 sm:px-3 md:px-4", // Even more responsive
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
        className: "h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10", // Even smaller on mobile
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
  shortText?: string // New prop for responsive text
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, iconOnly, asChild = false, shortText, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isMobile = window.innerWidth < 768 // Simple mobile check 
    
    // Use shortText on mobile if provided
    const displayContent = isMobile && shortText ? shortText : children
    
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
