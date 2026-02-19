"use client"

import { useQueryState } from 'nuqs'
import { Button } from '@/components/ui/button'

export function PortfolioGrid() {
    const [section, setSection] = useQueryState('section', { defaultValue: '' })

    const sections = [{url: 'All', v: ''}, {url: 'About me', v: 'About me'}, {url: 'Proyects', v: 'Proyects'}, {url: 'Experience', v: 'Experience'}, {url: 'Contact', v:'Contact'}]

    return (
        <nav className='flex flex-row gap-1.5 align-middle justify-center'>
            <ul>
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
    )
}