"use client"

import { forwardRef } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export const GridItem = forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
    ({ children, className, ...props }, ref) => (
        <div ref={ref} {...props}>
            <Card className={cn("min-h-full min-w-full", className)}>
                {children}
            </Card>
        </div>
    )
)

GridItem.displayName = "GridItem"