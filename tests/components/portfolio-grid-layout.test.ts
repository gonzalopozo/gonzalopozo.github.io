import { describe, expect, it } from 'vitest';
import {
	createCollectionCards,
	createSectionLayouts,
	getSectionCards,
	type GridBreakpoint,
	type PortfolioGridCard,
} from '@/components/public/portfolio-grid-layout';

const cards: PortfolioGridCard[] = [
	{
		id: 'experience-overview',
		content: null,
		variant: 'experience',
		homeSlot: 'g',
		sizeSlot: 'g',
	},
	{ id: 'info', content: null, variant: 'about', homeSlot: 'a', sizeSlot: 'a' },
	{ id: 'map', content: null, variant: 'about', homeSlot: 'b', sizeSlot: 'b' },
	{ id: 'music', content: null, variant: 'about', homeSlot: 'd', sizeSlot: 'd' },
	{ id: 'theme', content: null, variant: 'about', homeSlot: 'i', sizeSlot: 'i' },
	{ id: 'hobbies', content: null, variant: 'about', homeSlot: 'j', sizeSlot: 'j' },
	...createCollectionCards({
		projects: Array.from({ length: 6 }, (_, i) => ({ id: `project:${i}`, content: null })),
		experiences: Array.from({ length: 3 }, (_, i) => ({
			id: `experience:${i}`,
			content: null,
		})),
		socialLinks: Array.from({ length: 3 }, (_, i) => ({ id: `social:${i}`, content: null })),
	}),
];
const breakpoints: GridBreakpoint[] = ['lg', 'md', 'sm'];

describe('portfolio section layouts', () => {
	it('keeps the home limits and shows each matching record exactly once', () => {
		const home = getSectionCards(cards, null, 'lg');
		expect(home).toHaveLength(10);
		expect(home.filter(({ variant }) => variant === 'experience').map(({ id }) => id)).toEqual([
			'experience-overview',
		]);
		expect(home.filter(({ variant }) => variant === 'project')).toHaveLength(3);
		const projects = getSectionCards(cards, 'Projects', 'lg');
		expect(projects).toHaveLength(13);
		expect(new Set(projects.map(({ id }) => id)).size).toBe(projects.length);
		expect(projects.slice(0, 6).map(({ id }) => id)).toEqual(
			Array.from({ length: 6 }, (_, i) => `project:${i}`),
		);
		expect(projects.some(({ id }) => id === 'social:1' || id === 'experience:1')).toBe(false);
	});

	it.each(breakpoints)('keeps every about card first at %s', (breakpoint) => {
		const about = getSectionCards(cards, 'About me', breakpoint);
		expect(about.slice(0, 8).every(({ variant }) => variant === 'about')).toBe(true);
		expect(about.slice(8).every(({ variant }) => variant !== 'about')).toBe(true);
		expect(about[0].id).toBe('info');
	});

	it.each(breakpoints)(
		'creates layouts without overlaps and preserves card sizes at %s',
		(breakpoint) => {
			const home = createSectionLayouts(cards, null)[breakpoint];
			for (const section of [null, 'About me', 'Projects', 'Experience'] as const) {
				const layout = createSectionLayouts(cards, section)[breakpoint];
				for (const item of layout) {
					expect(item.x).toBeGreaterThanOrEqual(0);
					expect(item.x + item.w).toBeLessThanOrEqual(breakpoint === 'sm' ? 1 : 4);
					for (const other of layout.filter(({ i }) => i !== item.i)) {
						expect(
							item.x < other.x + other.w &&
								item.x + item.w > other.x &&
								item.y < other.y + other.h &&
								item.y + item.h > other.y,
						).toBe(false);
					}
				}
				for (const original of home) {
					const item = layout.find(({ i }) => i === original.i)!;
					expect([item.w, item.h]).toEqual([original.w, original.h]);
				}
			}
		},
	);

	it.each(breakpoints)('places background cards below all projects at %s', (breakpoint) => {
		const layout = createSectionLayouts(cards, 'Projects')[breakpoint];
		const foreground = layout.filter(({ i }) => i.startsWith('project:'));
		const background = layout.filter(({ i }) => !i.startsWith('project:'));
		expect(Math.min(...background.map(({ y }) => y))).toBeGreaterThanOrEqual(
			Math.max(...foreground.map(({ y, h }) => y + h)),
		);
	});

	it('handles missing records without phantom slots or mutating inputs', () => {
		const sparse = cards.filter(({ id }) => ['info', 'map', 'project:0'].includes(id));
		const before = structuredClone(sparse);
		expect(getSectionCards(sparse, 'Experience', 'sm')).toHaveLength(3);
		expect(createSectionLayouts(sparse, null).lg).toHaveLength(3);
		expect(sparse).toEqual(before);
		expect(createSectionLayouts([], 'Projects')).toEqual({ lg: [], md: [], sm: [] });
	});
});
