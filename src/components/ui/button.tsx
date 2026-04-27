import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-primary/95 to-primary/75 text-primary-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.25),0_4px_18px_-6px_hsl(var(--primary)/0.55)] hover:shadow-[inset_0_1px_0_hsl(0_0%_100%/0.3),0_6px_24px_-6px_hsl(var(--primary)/0.7)] hover:brightness-110",
        destructive:
          "bg-gradient-to-b from-destructive/95 to-destructive/75 text-destructive-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.2),0_4px_18px_-6px_hsl(var(--destructive)/0.55)] hover:brightness-110",
        outline:
          "border border-white/15 bg-white/[0.04] backdrop-blur-glass text-foreground hover:bg-white/[0.08] hover:border-primary/40 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.08)]",
        secondary:
          "bg-white/[0.06] text-secondary-foreground border border-white/10 backdrop-blur-glass hover:bg-white/[0.10] shadow-[inset_0_1px_0_hsl(0_0%_100%/0.06)]",
        ghost: "hover:bg-white/[0.06] hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
