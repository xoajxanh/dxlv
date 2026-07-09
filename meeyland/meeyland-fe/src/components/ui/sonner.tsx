"use client"

import { Toaster as SonnerToaster } from "sonner"

type ToasterProps = React.ComponentProps<typeof SonnerToaster>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <SonnerToaster
      theme="dark"
      closeButton={true}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-slate-900 group-[.toaster]:text-slate-100 group-[.toaster]:border-slate-800 group-[.toaster]:shadow-lg cursor-pointer",
          description: "group-[.toast]:text-slate-400",
          actionButton:
            "group-[.toast]:bg-sky-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-slate-800 group-[.toast]:text-slate-400",
          closeButton:
            "group-[.toast]:bg-slate-800 group-[.toast]:text-slate-400 group-[.toast]:border-slate-700 hover:group-[.toast]:bg-slate-700 hover:group-[.toast]:text-white cursor-pointer",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
