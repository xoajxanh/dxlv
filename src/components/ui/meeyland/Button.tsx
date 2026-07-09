import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-[#3390EC]/50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#3390EC] text-white hover:bg-[#4DA2F1] rounded-xl",
        secondary:
          "bg-[#273442] text-white hover:bg-[#2A3947] rounded-xl",
        outline:
          "border-[#304050] bg-transparent text-white hover:bg-[#2A3947]/40 rounded-xl",
        ghost:
          "text-slate-400 hover:text-white hover:bg-[#2A3947]/60 rounded-xl",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 rounded-xl",
        accent:
          "bg-[#3390EC] text-white hover:bg-[#4DA2F1] rounded-xl",
        link: "text-[#3390EC] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 gap-2",
        sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
        lg: "h-12 px-6 rounded-2xl gap-2",
        icon: "size-10 rounded-full p-0",
        "icon-sm": "size-8 rounded-full p-0",
        "icon-lg": "size-12 rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps
  extends ButtonPrimitive.Props,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

function Button({
  className,
  variant = "default",
  size = "default",
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
