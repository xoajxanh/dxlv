import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
}

function Input({ className, type, iconLeft, iconRight, ...props }: InputProps) {
  return (
    <div className="relative w-full">
      {iconLeft && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-500 z-10 pointer-events-none">
          {iconLeft}
        </div>
      )}
      <InputPrimitive
        type={type}
        data-slot="input"
        className={cn(
          "h-11 w-full min-w-0 rounded-xl border border-[#304050] bg-[#273442] px-4 py-2.5 text-sm text-white transition-all outline-none placeholder:text-slate-500 focus-visible:border-[#3390EC] focus-visible:ring-2 focus-visible:ring-[#3390EC]/20 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive",
          iconLeft && "pl-12",
          iconRight && "pr-12",
          className
        )}
        {...props}
      />
      {iconRight && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-500 z-10">
          {iconRight}
        </div>
      )}
    </div>
  )
}

export { Input }
export type { InputProps }
