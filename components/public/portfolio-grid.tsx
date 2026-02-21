"use client"

import { useQueryState } from 'nuqs'
import { Button } from '@/components/ui/button'
import ReactGridLayout, { useContainerWidth, Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { ReactNode } from 'react';

export function PortfolioGrid() {
    const [section, setSection] = useQueryState('section', { defaultValue: '' })

    const sections: { url: String, v: string | ((old: string) => string | null) | null, layout?: Layout, GridItems?: ReactNode }[] =
        [
            {
                url: 'All',
                v: '',
                layout: [
                    { i: "a", x: 0, y: 0, w: 1, h: 2, static: true },
                    { i: "b", x: 1, y: 0, w: 3, h: 2, minW: 2, maxW: 4 },
                    { i: "c", x: 4, y: 0, w: 1, h: 2 },
                    { i: "d", x: 0, y: 1, w: 1, h: 1 },
                    { i: "e", x: 1, y: 2, w: 2, h: 1 },
                    { i: "f", x: 3, y: 1, w: 1, h: 1 }
                ],
                GridItems: [
                    <div className='bg-red-500 min-w-full' key="a">a</div>,
                    <div className='bg-amber-500 min-w-full' key="b">b</div>,
                    <div className="bg-green-500 min-w-full" key="c">c</div>,
                ]
            },
            {
                url: 'About me',
                v: 'About me',
                layout: [
                    { i: "d", x: 0, y: 1, w: 1, h: 1 },
                    { i: "e", x: 1, y: 2, w: 2, h: 1 },
                    { i: "f", x: 3, y: 1, w: 1, h: 1 },
                ],
                GridItems: [
                    <div className='bg-teal-500 w-50' key="d">d</div>,
                    <div className='bg-fuchsia-500 w-50' key="e">e</div>,
                    <div className='bg-lime-500 w-50' key="f">f</div>,
                ]
            }, { url: 'Proyects', v: 'Proyects' }, { url: 'Experience', v: 'Experience' }, { url: 'Contact', v: 'Contact' }
        ]

    const resolvedSection = sections.find(e => e.v === section) ?? sections[0]
    const defaultLayout = sections[0].layout!
    const gridLayout = resolvedSection.layout ?? defaultLayout
    const gridContent = resolvedSection.GridItems ?? []

    const { width, containerRef, mounted } = useContainerWidth();

    const layout = [
        { i: "a", x: 0, y: 0, w: 1, h: 2, static: true },
        { i: "b", x: 1, y: 0, w: 3, h: 2, minW: 2, maxW: 4 },
        { i: "c", x: 4, y: 0, w: 1, h: 2 }
    ];

    return (
        <>
            <nav className='mt-2'>
                <ul className='flex flex-row gap-1.5 align-middle justify-center'>
                    {
                        sections.map(s => (
                            <li>
                                <Button onClick={() => setSection(s.v!)}>
                                    {s.url}
                                </Button>
                            </li>
                        ))
                    }
                </ul>
            </nav>


            {/* Necesitamos un estado para el layout  */}
            <div ref={containerRef} className='w-120 mx-3'>
                {mounted && (
                    <ReactGridLayout
                        layout={gridLayout}
                        width={width}
                        gridConfig={{ cols: 12, rowHeight: 30 }}
                        resizeConfig={{ enabled: false }}
                    >
                        <div className='bg-red-500 min-w-full' key="a">a</div>,
                        <div className='bg-amber-500 min-w-full' key="b">b</div>,
                        <div className='bg-green-500 min-w-full' key="c">c</div>,
                        {gridContent}
                    </ReactGridLayout>
                )}
            </div>
        </>
    )
}