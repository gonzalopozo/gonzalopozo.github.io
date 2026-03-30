"use client"

import { forwardRef } from "react"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button";
import { PortfolioSection } from "@/components/public/portfolio-grid";
import { ProjectInfo } from "@/lib/types";
import { ArrowBigDownDashIcon } from "lucide-react";
import { FaExternalLinkAlt, FaGithub } from "react-icons/fa";
import Image from "next/image";
import { StatusIndicator } from "@/components/public/status-indicator";


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
    about: { section: "About me", label: "¡Conoce más de mí!" },
    contact: { section: "Contact", label: "¡Contáctame!" },
    experience: { section: "Experience", label: "¡Descubre mi experiencia!" },
    project: { section: "Projects", label: "¡Descubre mis proyectos!" },
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
                "text-card-foreground bg-card": variant !== "map",
                "gap-0 p-0 py-0": variant === "map",
                "grid grid-cols-1 grid-rows-[auto repeat(3, 1fr)] pt-0": variant === "project"
            })}>
                {(variant === "project") && project && (
                    <>
                        <figure className="min-h-0 overflow-hidden">

                        <Image src={"https://placehold.co/1200x630.png"} alt={"Project image"} width={1260} height={630} className="h-full w-full object-cover" />
                        </figure>
                        <CardHeader className="content-start items-start">
                            <CardTitle className="flex items-center justify-between">
                                {project.title}
                                <StatusIndicator status={project.status} />
                            </CardTitle>
                            <CardDescription>
                                {project.description}
                            </CardDescription>
                            {/* <CardAction>
                                See more here <ArrowBigDownDashIcon />
                            </CardAction> */}
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between gap-4">
                                <p>Proyecto desarrollado con {project.projectSkills.map(({ skill }) => skill.name).join(", ")}</p>
                                <div className="flex items-center justify-evenly grow">
                                    {project.repoUrl && (
                                        <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="View repository on GitHub">
                                            <FaGithub className="size-5" aria-hidden="true" />
                                        </a>
                                    )}
                                    {project.url && (
                                        <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="View live project">
                                            <FaExternalLinkAlt className="size-4" aria-hidden="true" />
                                        </a>
                                    )}
                                </div>
                            </div>
                            <p>Estado: <span className={cn("font-bold", project.status === "active" && "text-status-active", project.status === "archived" && "text-status-archived", project.status === "in-progress" && "text-status-in-progress")}>{project.status}</span></p>
                        </CardContent>
                        <CardFooter className="flex flex-col items-start gap-3">
                            Creado el {project.createdAt.getDate()}/{project.createdAt.getMonth() + 1}/{project.createdAt.getFullYear()}

                            {!section && setSection && (
                                <ShowMoreButton variant={variant} setSection={setSection} />
                            )}
                        </CardFooter>
                    </>

                )}

                {variant !== "project" && (
                    children
                )}

                {!section && variant !== "project" && setSection && variant !== "map" && (
                    <ShowMoreButton variant={variant} setSection={setSection} />
                )}
            </Card>
        </div>
    )
)

GridItem.displayName = "GridItem"