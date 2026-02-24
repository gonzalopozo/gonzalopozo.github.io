"use client"

import { useQueryState, parseAsStringLiteral } from 'nuqs'
import { Button } from '@/components/ui/button'
import { Responsive, useContainerWidth, Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { ReactNode, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { RiGithubLine } from "react-icons/ri";
import 'maplibre-gl/dist/maplibre-gl.css';
import Map, { Marker } from 'react-map-gl/maplibre';
import { MapGLStyleSwitcher, type StyleItem } from 'map-gl-style-switcher/react-map-gl';
import 'map-gl-style-switcher/dist/map-gl-style-switcher.css';
import { OpenMapTilesLanguage } from '@teritorio/openmaptiles-gl-language';
import MaplibreTransition from 'maplibre-transition';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { GridItem } from '@/components/public/grid-item';

/** OpenFreeMap styles use OpenMapTiles schema — compatible with OpenMapTilesLanguage for label localization. */
const MAP_STYLES: StyleItem[] = [
    {
        id: 'liberty',
        name: 'Liberty',
        image: 'https://raw.githubusercontent.com/muimsd/map-gl-style-switcher/refs/heads/main/public/voyager.png',
        styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
        description: 'Liberty style from OpenFreeMap',
    },
    {
        id: 'positron',
        name: 'Positron',
        image: 'https://raw.githubusercontent.com/muimsd/map-gl-style-switcher/refs/heads/main/public/positron.png',
        styleUrl: 'https://tiles.openfreemap.org/styles/positron',
        description: 'Positron style from OpenFreeMap',
    },
    {
        id: 'bright',
        name: 'Bright',
        image: 'https://raw.githubusercontent.com/muimsd/map-gl-style-switcher/refs/heads/main/public/voyager.png',
        styleUrl: 'https://tiles.openfreemap.org/styles/bright',
        description: 'Bright style from OpenFreeMap',
    },
    {
        id: 'dark',
        name: 'Dark',
        image: 'https://raw.githubusercontent.com/muimsd/map-gl-style-switcher/refs/heads/main/public/dark.png',
        styleUrl: 'https://tiles.openfreemap.org/styles/dark',
        description: 'Dark style from OpenFreeMap',
    },
];

const PORTFOLIO_SECTIONS = ['About me', 'Projects', 'Experience', 'Contact'] as const

export type PortfolioSection = (typeof PORTFOLIO_SECTIONS)[number]

export function PortfolioGrid() {
    const [section, setSection] = useQueryState('section', parseAsStringLiteral(PORTFOLIO_SECTIONS))
    const languageControlRef = useRef<OpenMapTilesLanguage | null>(null)
    const [mapStyle, setMapStyle] = useState(MAP_STYLES[0].styleUrl)
    const [activeStyleId, setActiveStyleId] = useState(MAP_STYLES[0].id)

    const applyMapLanguage = useCallback((map: MapLibreMap) => {
        const browserLang = (navigator.languages?.[0] || navigator.language || 'en').split('-')[0]
        const supported = ['es', 'en', 'de', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar']
        const lang = supported.includes(browserLang) ? browserLang : 'en'
        languageControlRef.current?.setLanguage(lang)
    }, [])

    const handleMapLoad = useCallback((evt: { target: MapLibreMap }) => {
        const map = evt.target
        MaplibreTransition.init(map)
        const languageControl = new OpenMapTilesLanguage({
            languageField: /^name(_|:)/,
            getLanguageField: (lang: string) => (lang === 'mul' ? 'name' : `name_${lang}`),
        })
        languageControlRef.current = languageControl
        map.addControl(languageControl, 'top-right')
        map.on('styledata', () => applyMapLanguage(map))
    }, [applyMapLanguage])

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
                        <div className='h-full w-full min-h-0 min-w-0 overflow-hidden bg-card rounded-4xl text-card-foreground' key='b'>
                            <Map
                                initialViewState={{ latitude: 40.275, longitude: -3.915, zoom: 11 }}
                                style={{ width: "100%", height: "100%" }}
                                mapStyle={mapStyle}
                                attributionControl={false}
                                onLoad={handleMapLoad}
                            >
                                <MapGLStyleSwitcher
                                    styles={MAP_STYLES}
                                    activeStyleId={activeStyleId}
                                    onStyleChange={(styleUrl) => {
                                        setMapStyle(styleUrl)
                                        const style = MAP_STYLES.find((s) => s.styleUrl === styleUrl)
                                        if (style) setActiveStyleId(style.id)
                                    }}
                                    position="bottom-left"
                                    theme="auto"
                                />
                                <Marker latitude={40.275} longitude={-3.915} color="red" />
                            </Map>
                        </div>
                        <div className='bg-green-500 rounded-4xl flex justify-center items-center' key="c">C</div>
                        {gridContent}
                    </Responsive>
                )}
            </div>
        </>
    )
}