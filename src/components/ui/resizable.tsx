import * as React from "react"
import { GripVertical } from "lucide-react"

import { cn } from "@/lib/utils"

const Resizable = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex", className)} {...props} />
)
Resizable.displayName = "Resizable"

const ResizablePanel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    defaultSize?: number
    minSize?: number
    maxSize?: number
  }
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 overflow-auto", className)}
    {...props}
  />
))
ResizablePanel.displayName = "ResizablePanel"

const ResizableHandle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    withHandle?: boolean
  }
>(({ className, withHandle, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex w-px select-none touch-none bg-border after:absolute after:left-1/2 after:top-1/2 after:h-8 after:w-1 after:-translate-x-1/2 after:-translate-y-1/2 hover:after:bg-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring data-[state=dragging]:after:bg-border",
      className,
    )}
    {...props}
  >
    {withHandle && (
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <GripVertical className="h-4 w-4 text-border" />
      </div>
    )}
  </div>
))
ResizableHandle.displayName = "ResizableHandle"

export { Resizable, ResizablePanel, ResizableHandle }
