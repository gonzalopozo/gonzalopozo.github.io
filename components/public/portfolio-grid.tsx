"use client"

import { useQueryState, parseAsStringLiteral } from 'nuqs'
import { Button } from '@/components/ui/button'
import { Responsive, useContainerWidth, Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { ReactNode } from 'react';
import Image from 'next/image';
import { RiGithubLine } from "react-icons/ri";
import { Map, MapControls } from "@/components/ui/map";
import { GridItem } from '@/components/public/grid-item';
import { ModeToggle } from '@/components/theme-toggler';

const PORTFOLIO_SECTIONS = ['About me', 'Projects', 'Experience', 'Contact'] as const

export type PortfolioSection = (typeof PORTFOLIO_SECTIONS)[number]

export function PortfolioGrid() {
    const [section, setSection] = useQueryState('section', parseAsStringLiteral(PORTFOLIO_SECTIONS))

    const sections: { url: string; v: PortfolioSection | null; layouts?: { lg: Layout; md: Layout }; GridItems?: ReactNode }[] =
        [
            {
                url: 'All',
                v: null,
                layouts: {
                    lg: [
                        { i: "a", x: 0, y: 0, w: 4, h: 10 },
                        { i: "b", x: 4, y: 0, w: 2, h: 7 },
                        { i: "c", x: 2, y: 2, w: 1, h: 1 },
                    ],
                    md: [
                        { i: "a", x: 0, y: 0, w: 2, h: 8 },
                        { i: "b", x: 1, y: 1, w: 3, h: 2 },
                        { i: "c", x: 2, y: 2, w: 1, h: 1 },
                    ],
                },
                GridItems: []
            },
            {
                url: 'About me',
                v: 'About me',
                layouts: {
                    lg: [
                        { i: "d", x: 0, y: 1, w: 1, h: 1 },
                        { i: "e", x: 1, y: 2, w: 2, h: 1 },
                        { i: "f", x: 3, y: 1, w: 1, h: 1 },
                    ],
                    md: [
                        { i: "d", x: 0, y: 0, w: 2, h: 8 },
                        { i: "e", x: 1, y: 1, w: 3, h: 2 },
                        { i: "f", x: 2, y: 2, w: 1, h: 1 },
                    ],
                },
                GridItems: [
                    <div className='bg-teal-500 w-50' key="d">d</div>,
                    <div className='bg-fuchsia-500 w-50' key="e">e</div>,
                    <div className='bg-lime-500 w-50' key="f">f</div>,
                ]
            }, { url: 'Projects', v: 'Projects' }, { url: 'Experience', v: 'Experience' }, { url: 'Contact', v: 'Contact' }
        ]

    const resolvedSection = sections.find(e => e.v === section) ?? sections[0]
    const gridLayouts = resolvedSection.layouts
    const gridContent = resolvedSection.GridItems

    const { width, containerRef, mounted } = useContainerWidth();

    return (
        <>
            <nav className='h-32 px-[3.5vw]'>
                <ul className='flex flex-row gap-1.5 items-center-safe justify-center h-full'>
                    {
                        sections.map(s => (
                            <li key={s.url}>
                                <Button onClick={() => setSection(s.v)}>
                                    {s.url}
                                </Button>
                            </li>
                        ))
                    }
                    <ModeToggle />
                </ul>
            </nav>

            <div ref={containerRef} className='px-[3.5vw] max-w-[1200px] mx-auto'>
                {mounted && (
                    <Responsive
                        layouts={gridLayouts}
                        width={width}
                        breakpoints={{ lg: 996, md: 768, sm: 0 }}
                        cols={{ lg: 10, md: 6, sm: 1 }}
                        rowHeight={30}
                        resizeConfig={{ enabled: false }}
                    >
                        <GridItem variant='about' section={section} setSection={setSection} className='flex flex-col items-start gap-2' key="a">
                            <figure className='shrink-0'>
                                <Image
                                    src="/360.png"
                                    width={70}
                                    height={120}
                                    alt="Picture of Gonzalo"
                                    className="max-w-full h-auto object-contain"
                                />
                            </figure>
                            <div>
                                <h3 className='text-primary'>Gonzalo</h3>
                                <p className="text-muted-foreground">
                                    Apasionado por la tecnología, creo soluciones creativas y funcionales en la web. Siempre aprendiendo algo nuevo.
                                </p>
                            </div>
                            <Button
                                asChild
                                variant="default"
                                size="icon"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                            >
                                <a
                                    href="https://github.com/gonzalopozo"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2"
                                    aria-label='GitHub Profile'
                                >
                                    <RiGithubLine className="size-5 shrink-0" aria-hidden />
                                </a>
                            </Button>
                        </GridItem>
                        <GridItem variant='map' section={section} key="b">
                            <Map center={[-3.916, 40.273]} zoom={13} attributionControl={false}>
                                <MapControls />
                            </Map>
                        </GridItem>
                        <div className='bg-green-500 rounded-4xl flex justify-center items-center' key="c">C</div>
                        {gridContent}
                    </Responsive>
                )}
            </div>
        </>
    )
}