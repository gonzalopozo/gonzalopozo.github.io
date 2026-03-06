"use client"

import { forwardRef } from "react"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button";
import { PortfolioSection } from "@/components/public/portfolio-grid";
import { ProjectInfo } from "@/lib/types";
import { ArrowBigDownDashIcon } from "lucide-react";
import { FaExternalLinkAlt, FaGithub } from "react-icons/fa";


export type GridItemVariant = 'about' | 'project' | 'experience' | 'contact' | 'map';
type SetSection = (variant: PortfolioSection | null) => Promise<URLSearchParams>

interface GridItemProps {
    variant: GridItemVariant
    section: PortfolioSection | null
    setSection?: SetSection
    project?: ProjectInfo
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
    ({ children, className, variant, section, setSection, project, ...props }, ref) => (
        <div ref={ref} {...props}>
            <Card className={cn("size-full min-h-0 min-w-0 overflow-hidden bg-card rounded-4xl", className, {
                "text-card-foreground p-6 bg-card": variant !== "map",
                "gap-0 p-0 py-0": variant === "map",
            })}>
                {(variant === "project") && project && (
                    <>
                        <CardHeader>
                            <CardTitle>
                                {project.title}
                            </CardTitle>
                            <CardDescription>
                                {project.description}
                            </CardDescription>
                            <CardAction>
                                See more here <ArrowBigDownDashIcon />
                            </CardAction>
                        </CardHeader>
                        <CardContent>
                            Proyecto desarrollado con {project.projectSkills.map(({ skill }) => skill.name).join(", ")}
                            Estado: {project.status}
                            <div className="flex">
                                {project.repoUrl && (<a href={project.repoUrl}> <FaGithub /> </a>)}
                                {project.url && (<a href={project.url}> <FaExternalLinkAlt /> </a>)}
                            </div>
                        </CardContent>
                        <CardFooter>
                            ¡Proyecto desarrollado por mi en el mes {project.createdAt.getMonth() + 1} del año {project.createdAt.getFullYear()}!
                        </CardFooter>
                    </>

                )}

                {variant !== "project" && (
                    children
                )}

                {!section && setSection && variant !== "map" && (
                    <ShowMoreButton variant={variant} setSection={setSection} />
                )}
            </Card>
        </div>
    )
)

GridItem.displayName = "GridItem"