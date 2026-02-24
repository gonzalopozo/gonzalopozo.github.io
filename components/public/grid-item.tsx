"use client"

import { forwardRef } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button";
import { PortfolioSection } from "@/components/public/portfolio-grid";

export type GridItemVariant = 'about' | 'project' | 'experience' | 'contact' | 'map';
type SetSection = (variant: PortfolioSection | null) => Promise<URLSearchParams>

interface GridItemProps {
    variant: GridItemVariant
    section: PortfolioSection | null
    setSection?: SetSection
}

interface ShowMoreButtonProps {
    variant: Exclude<GridItemVariant, 'map'>
    setSection: SetSection
}

const VARIANT_CONFIG: Record<Exclude<GridItemVariant, 'map'>, { section: PortfolioSection; label: string }> = {
    about:      { section: "About me",    label: "¡Conoce más de mí!" },
    contact:    { section: "Contact",     label: "¡Contáctame!" },
    experience: { section: "Experience",  label: "¡Descubre mi experiencia!" },
    project:    { section: "Projects",    label: "¡Descubre mis proyectos!" },
}

function ShowMoreButton({ variant, setSection }: ShowMoreButtonProps) {
    const { section, label } = VARIANT_CONFIG[variant]

    return (
        <Button onClick={() => setSection(section)}>
            {label}
        </Button>
    )
}

export const GridItem = forwardRef<HTMLDivElement, React.ComponentProps<"div"> & GridItemProps>(
    ({ children, className, variant, section, setSection, ...props }, ref) => (
        <div ref={ref} {...props}>
            <Card className={cn("h-full w-full min-h-0 min-w-0 overflow-hidden bg-card rounded-4xl", className, {
                "text-card-foreground p-6 bg-card": variant !== "map"
            })}>
                {children}

                {!section && setSection && variant !== "map" && (
                    <ShowMoreButton variant={variant} setSection={setSection} />
                )}
            </Card>
        </div>
    )
)

GridItem.displayName = "GridItem"