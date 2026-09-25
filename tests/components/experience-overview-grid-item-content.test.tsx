import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExperienceOverviewGridItemContent } from '@/components/public/experience-overview-grid-item-content';

vi.mock('@/components/public/dynamic-icon', () => ({
	DynamicIcon: ({ iconFullName, className }: { iconFullName: string; className: string }) => (
		<span data-icon-name={iconFullName} className={className} />
	),
}));
vi.mock('@/components/public/grid-item-show-more-button', () => ({
	GridItemShowMoreButton: () => <button>View experience</button>,
}));

afterEach(cleanup);

describe('experience overview marquee', () => {
	it('leaves the track out when no used skill has an icon', () => {
		const { container } = render(<ExperienceOverviewGridItemContent skills={[]} />);
		expect(container.querySelector('.animate-tech-marquee')).toBeNull();
		expect(container.firstElementChild?.className).toContain('grid-rows-[1fr_auto]');
	});

	it('fills the loop with one used skill and colors it only on card hover', () => {
		const { container } = render(
			<ExperienceOverviewGridItemContent
				skills={[
					{
						id: 1,
						name: 'React',
						icon: 'SiReact|si',
						useColor: true,
						customColor: '#61dafb',
						usageCount: 1,
					},
				]}
			/>,
		);
		const icons = container.querySelectorAll('[data-icon-name]');
		expect(icons).toHaveLength(20);
		expect(icons[0].className).toContain('group-hover/grid-item:text-(--icon-color)');
	});

	it('keeps disabled colors muted across the repeated sequence', () => {
		const skills = [
			{
				id: 1,
				name: 'React',
				icon: 'SiReact|si',
				useColor: true,
				customColor: '#61dafb',
				usageCount: 2,
			},
			{
				id: 2,
				name: 'TypeScript',
				icon: 'SiTypescript|si',
				useColor: false,
				customColor: '#3178c6',
				usageCount: 1,
			},
		];
		const { container } = render(<ExperienceOverviewGridItemContent skills={skills} />);
		const icons = container.querySelectorAll('[data-icon-name]');
		expect(icons).toHaveLength(20);
		expect(icons[0].className).toContain('group-hover/grid-item:text-(--icon-color)');
		expect(icons[1].className).toBe('size-7');
	});
});
